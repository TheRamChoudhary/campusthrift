const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY || "sk_test_mock_stripe_key_for_testing",
);
const Request = require("../models/Request");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route POST /api/v1/payments/stripe/create-checkout
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
  const { requestId } = req.body;

  if (!requestId) {
    throw new ApiError(400, "Request ID is required");
  }

  const request = await Request.findById(requestId)
    .populate("listing")
    .populate("seller", "name email");
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to pay for this request");
  }

  if (request.status !== "approved") {
    throw new ApiError(400, "This request has not been approved by the seller");
  }

  if (request.paymentStatus === "paid") {
    throw new ApiError(400, "This request has already been paid");
  }

  const listing = request.listing;
  if (!listing) {
    throw new ApiError(404, "Listing not found for this request");
  }

  if (listing.status === "sold") {
    throw new ApiError(400, "This item is already sold");
  }

  // Graceful fallback for local development
  if (
    !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY === "sk_test_mock_stripe_key_for_testing"
  ) {
    const sessionUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard?tab=buyer&payment_status=success`;
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: "cs_test_mock_" + Math.random().toString(36).substr(2, 9),
          url: sessionUrl,
          isSimulated: true,
        },
        "Stripe Session created (SIMULATED)",
      ),
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: listing.title,
              description: `NIT Trichy Marketplace - Sold by ${request.seller.name}`,
            },
            unit_amount: listing.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard?tab=buyer&payment_status=success&session_id={CHECKOUT_SESSION_ID}&request_id=${request._id}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard?tab=buyer&payment_status=cancel`,
      metadata: {
        requestId: request._id.toString(),
        buyerId: req.user._id.toString(),
        sellerId: request.seller._id.toString(),
        listingId: listing._id.toString(),
        price: listing.price.toString(),
      },
    });

    res.status(200).json(
      new ApiResponse(200, { id: session.id, url: session.url }, "Stripe Session created successfully"),
    );
  } catch (error) {
    throw new ApiError(500, `Stripe Session creation failed: ${error.message}`);
  }
});

// @route POST /api/v1/payments/stripe/webhook
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = req.body;
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { requestId, buyerId, sellerId, listingId, price } = session.metadata;

    try {
      const request = await Request.findById(requestId);
      const listing = await Listing.findById(listingId);
      const seller = await User.findById(sellerId);

      if (request && listing && seller) {
        request.paymentStatus = "paid";
        await request.save();

        listing.status = "sold";
        await listing.save();

        seller.walletBalance += Number(price);
        await seller.save();

        const transactionId = "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        await Transaction.create({
          listing: listingId,
          request: requestId,
          buyer: buyerId,
          seller: sellerId,
          amount: Number(price),
          paymentMethod: "card",
          transactionId,
          type: "purchase",
          status: "completed",
        });

        await AuditLog.create({
          action: "PAYMENT_STRIPE_SUCCESS",
          performedBy: buyerId,
          ipAddress: req.ip || "webhook-worker",
          details: `Stripe payment for "${listing.title}". Amount: ₹${price}. Trans ID: ${transactionId}.`,
        });

        await Notification.create({
          user: sellerId,
          type: "payment",
          title: "Payment Received! 💸",
          message: `Received ₹${price} via Stripe for item "${listing.title}".`,
          link: "/dashboard?tab=seller",
        });

        await Notification.create({
          user: buyerId,
          type: "payment",
          title: "Payment Sent! 🛍️",
          message: `Paid ₹${price} for item "${listing.title}" successfully.`,
          link: "/dashboard?tab=buyer",
        });

        console.log(`✅ Stripe payment verified for Request: ${requestId}`);
      }
    } catch (dbError) {
      console.error("❌ Webhook DB operations failed:", dbError.message);
      return res.status(500).json({ error: "DB operations failed" });
    }
  }

  res.status(200).json({ received: true });
};

// @route POST /api/v1/payments/stripe/verify-payment
exports.verifyDirectPayment = asyncHandler(async (req, res, next) => {
  const { sessionId, requestId } = req.body;

  if (!sessionId || !requestId) {
    throw new ApiError(400, "Session ID and Request ID are required");
  }

  const request = await Request.findById(requestId).populate("listing");
  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  if (request.paymentStatus === "paid") {
    return res.status(200).json(new ApiResponse(200, { request }, "Payment already verified"));
  }

  // Simulated / mocked Stripe
  if (sessionId.startsWith("cs_test_mock")) {
    const listing = request.listing;

    request.paymentStatus = "paid";
    await request.save();

    listing.status = "sold";
    await listing.save();

    const seller = await User.findById(request.seller);
    seller.walletBalance += listing.price;
    await seller.save();

    const transactionId = "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    await Transaction.create({
      listing: listing._id,
      request: request._id,
      buyer: request.buyer,
      seller: seller._id,
      amount: listing.price,
      paymentMethod: "card",
      transactionId,
      type: "purchase",
      status: "completed",
    });

    await Notification.create({
      user: seller._id,
      type: "payment",
      title: "Payment Received! 💸",
      message: `Received ₹${listing.price} for item "${listing.title}".`,
      link: "/dashboard?tab=seller",
    });

    await Notification.create({
      user: request.buyer,
      type: "payment",
      title: "Payment Sent! 🛍️",
      message: `Paid ₹${listing.price} for item "${listing.title}" (simulated).`,
      link: "/dashboard?tab=buyer",
    });

    await AuditLog.create({
      action: "PAYMENT_SIMULATED_SUCCESS",
      performedBy: req.user._id,
      ipAddress: req.ip || "127.0.0.1",
      details: `Simulated payment for "${listing.title}". Amount: ₹${listing.price}. Trans ID: ${transactionId}.`,
    });

    const updatedRequest = await Request.findById(request._id).populate("listing");
    return res.status(200).json(new ApiResponse(200, { request: updatedRequest }, "Payment processed (SIMULATED)"));
  }

  // Real Stripe verification
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      request.paymentStatus = "paid";
      await request.save();

      const listing = request.listing;
      listing.status = "sold";
      await listing.save();

      const seller = await User.findById(request.seller);
      seller.walletBalance += listing.price;
      await seller.save();

      const transactionId = "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
      await Transaction.create({
        listing: listing._id,
        request: request._id,
        buyer: request.buyer,
        seller: seller._id,
        amount: listing.price,
        paymentMethod: "card",
        transactionId,
        type: "purchase",
        status: "completed",
      });

      await Notification.create({
        user: seller._id,
        type: "payment",
        title: "Payment Received! 💸",
        message: `Received ₹${listing.price} via Stripe for item "${listing.title}".`,
        link: "/dashboard?tab=seller",
      });

      await Notification.create({
        user: request.buyer,
        type: "payment",
        title: "Payment Sent! 🛍️",
        message: `Paid ₹${listing.price} via Stripe for item "${listing.title}".`,
        link: "/dashboard?tab=buyer",
      });

      await AuditLog.create({
        action: "PAYMENT_STRIPE_DIRECT_SUCCESS",
        performedBy: req.user._id,
        ipAddress: req.ip || "127.0.0.1",
        details: `Stripe Direct verified for "${listing.title}". Amount: ₹${listing.price}. Trans ID: ${transactionId}.`,
      });

      res.status(200).json(new ApiResponse(200, { request }, "Stripe Payment verified successfully"));
    } else {
      throw new ApiError(400, "Session is not paid yet");
    }
  } catch (error) {
    throw new ApiError(500, `Stripe direct verification failed: ${error.message}`);
  }
});
