const Transaction = require("../models/Transaction");
const Request = require("../models/Request");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route POST /api/v1/payments/pay
// Process a listing payment
exports.processPayment = asyncHandler(async (req, res, next) => {
  const { requestId, paymentMethod } = req.body;

  if (!requestId || !paymentMethod) {
    throw new ApiError(400, "Request ID and payment method are required");
  }

  const request = await Request.findById(requestId).populate("listing");
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

  const price = listing.price;

  const buyer = await User.findById(req.user._id);
  const seller = await User.findById(request.seller);

  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  // If payment method is wallet, check and deduct balance
  if (paymentMethod === "wallet") {
    if (buyer.walletBalance < price) {
      throw new ApiError(
        400,
        `Insufficient wallet balance. You need ₹${price - buyer.walletBalance} more.`,
      );
    }
    buyer.walletBalance -= price;
    await buyer.save();
  }

  // Credit the seller's wallet balance
  seller.walletBalance += price;
  await seller.save();

  // Update request paymentStatus and listing status
  request.paymentStatus = "paid";
  await request.save();

  listing.status = "sold";
  await listing.save();

  // Generate unique transaction ID
  const transactionId =
    "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  // Create Transaction record
  const transaction = await Transaction.create({
    listing: listing._id,
    request: request._id,
    buyer: buyer._id,
    seller: seller._id,
    amount: price,
    paymentMethod,
    transactionId,
    type: "purchase",
    status: "completed",
  });

  // Create real-time notification alerts
  await Notification.create({
    user: seller._id,
    type: "payment",
    title: "Payment Received! 💸",
    message: `Received ₹${price} via ${paymentMethod} for item "${listing.title}".`,
    link: "/dashboard?tab=seller",
  });

  await Notification.create({
    user: buyer._id,
    type: "payment",
    title: "Payment Sent! 🛍️",
    message: `Paid ₹${price} for item "${listing.title}" successfully.`,
    link: "/dashboard?tab=buyer",
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transaction, walletBalance: buyer.walletBalance },
        "Payment processed successfully",
      ),
    );
});

// @route POST /api/v1/payments/topup
// Top up virtual wallet balance
exports.topupWallet = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "Valid top-up amount is required");
  }

  const user = await User.findById(req.user._id);
  user.walletBalance += Number(amount);
  await user.save();

  // Generate unique transaction ID
  const transactionId =
    "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  // Create Transaction log for Top Up
  const transaction = await Transaction.create({
    buyer: user._id,
    amount: Number(amount),
    paymentMethod: "card", // Mock credit card for top-up
    transactionId,
    type: "topup",
    status: "completed",
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transaction, walletBalance: user.walletBalance },
        "Wallet topped up successfully",
      ),
    );
});

// @route GET /api/v1/payments/history
// Get transaction ledger for the current user
exports.getTransactionHistory = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Find all transactions where user is buyer or seller
  const transactions = await Transaction.find({
    $or: [{ buyer: userId }, { seller: userId }],
  })
    .populate("listing", "title price")
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        transactions,
        "Transaction history fetched successfully",
      ),
    );
});
