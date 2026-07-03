const mongoose = require("mongoose");
const Request = require("../models/Request");
const Listing = require("../models/Listing");
const Notification = require("../models/Notification");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route POST /api/v1/requests
// Buyer sends a request
exports.createRequest = asyncHandler(async (req, res, next) => {
  const { listingId, message } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) throw new ApiError(404, "Listing not found");

  if (listing.status !== "available") {
    throw new ApiError(400, "This item is no longer available");
  }

  if (listing.seller.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot request your own listing");
  }

  const existingRequest = await Request.findOne({
    listing: listingId,
    buyer: req.user._id,
  });
  if (existingRequest) {
    throw new ApiError(409, "You have already sent a request for this listing");
  }

  const request = await Request.create({
    listing: listingId,
    buyer: req.user._id,
    seller: listing.seller,
    message,
  });

  // Notify Seller
  await Notification.create({
    user: listing.seller,
    type: "request",
    title: "New Buy Request! 📥",
    message: `${req.user.name} requested to buy "${listing.title}".`,
    link: "/dashboard?tab=seller",
  });

  res
    .status(201)
    .json(new ApiResponse(201, request, "Request sent successfully"));
});

// @route GET /api/v1/requests/buyer
// Buyer sees their own requests
exports.getBuyerRequests = asyncHandler(async (req, res, next) => {
  const requests = await Request.find({ buyer: req.user._id })
    .populate("listing", "title price category condition")
    .populate("seller", "name email")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, requests, "Your requests fetched successfully"));
});

// @route GET /api/v1/requests/seller
// Seller sees requests on their listings
exports.getSellerRequests = asyncHandler(async (req, res, next) => {
  const requests = await Request.find({ seller: req.user._id })
    .populate("listing", "title price category condition")
    .populate("buyer", "name email")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(200, requests, "Incoming requests fetched successfully"),
    );
});

// @route PUT /api/v1/requests/:id/approve
exports.approveRequest = asyncHandler(async (req, res, next) => {
  // Atomic update: only succeeds if status is still "pending" — prevents race conditions
  const request = await Request.findOneAndUpdate(
    {
      _id: req.params.id,
      seller: req.user._id,
      status: "pending", // Guard: only update if still pending
    },
    { status: "approved" },
    { new: true },
  );

  if (!request) {
    // Either not found, not authorized, or already processed — check which
    const existing = await Request.findById(req.params.id);
    if (!existing) throw new ApiError(404, "Request not found");
    if (existing.seller.toString() !== req.user._id.toString())
      throw new ApiError(403, "Not authorized");
    throw new ApiError(400, "Request already processed");
  }

  const listing = await Listing.findById(request.listing);

  // Notify Buyer
  await Notification.create({
    user: request.buyer,
    type: "request",
    title: "Buy Request Approved! 🎉",
    message: `Your request for "${listing?.title || "item"}" was approved!`,
    link: "/dashboard?tab=buyer",
  });

  // Create a conversation for the buyer and seller if it doesn't already exist
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, request.buyer] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, request.buyer],
      listing: request.listing,
    });
  } else {
    // Update active listing in conversation
    conversation.listing = request.listing;
    await conversation.save();
  }

  // Add an initial system/automated message to start the chat
  const initMessage = await Message.create({
    conversation: conversation._id,
    sender: req.user._id, // the seller who approved
    recipient: request.buyer,
    text: `Hi! I have approved your request for "${listing?.title}". Let's chat about the details!`,
    listing: request.listing,
    status: "delivered"
  });

  // Update conversation's last message
  conversation.lastMessage = initMessage._id;
  await conversation.save();

  // Emit socket events for real-time chat updates
  const io = req.app.get("io");
  if (io) {
    const msgData = await Message.findById(initMessage._id).populate(
      "listing",
      "title price images status condition",
    );
    const messageData = msgData.toObject();
    
    // Alert the buyer in real-time
    io.to(request.buyer.toString()).emit("messageReceived", messageData);

    // Sync across the seller's tabs in real-time
    io.to(req.user._id.toString()).emit("messageSentSync", messageData);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { request, conversationId: conversation._id },
      "Request approved",
    ),
  );
});

// @route PUT /api/v1/requests/:id/reject
exports.rejectRequest = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id);
  if (!request) throw new ApiError(404, "Request not found");

  if (request.seller.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Request already processed");
  }

  request.status = "rejected";
  await request.save();

  const listing = await Listing.findById(request.listing);

  // Notify Buyer
  await Notification.create({
    user: request.buyer,
    type: "request",
    title: "Request Declined ❌",
    message: `Your request for "${listing?.title || "item"}" was declined by the seller.`,
    link: "/dashboard?tab=buyer",
  });

  res.status(200).json(new ApiResponse(200, request, "Request rejected"));
});
