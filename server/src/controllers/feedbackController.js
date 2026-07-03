const Feedback = require("../models/Feedback");
const Review = require("../models/Review");
const User = require("../models/User");
const Listing = require("../models/Listing");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// Helper to recalculate user's trust score
const recalculateTrustScore = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const rollNo = user.email.split("@")[0];

    // Find direct reviews
    const reviews = await Review.find({ seller: userId });

    // Find ratings in Feedback collection submitted by other users about this seller
    const feedbackRatings = await Feedback.find({
      type: "rating",
      targetRollNo: { $regex: `^${rollNo}$`, $options: "i" },
      rating: { $exists: true },
    });

    let trustScore = 100;
    const totalReviewRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const totalFeedbackRatings = feedbackRatings.reduce((sum, f) => sum + f.rating, 0);
    const totalCount = reviews.length + feedbackRatings.length;

    if (totalCount > 0) {
      const averageRating = (totalReviewRatings + totalFeedbackRatings) / totalCount;
      trustScore = (averageRating / 5) * 100;
    }

    // Check for active (pending or reviewed, but not resolved) complaints against the user
    const unresolvedComplaintsCount = await Feedback.countDocuments({
      type: "complaint",
      status: { $ne: "resolved" },
      $or: [
        { description: { $regex: userId.toString(), $options: "i" } },
        { subject: { $regex: userId.toString(), $options: "i" } },
        { targetRollNo: { $regex: `^${rollNo}$`, $options: "i" } },
      ],
    });

    // Subtract 10 points for each unresolved complaint
    trustScore = trustScore - unresolvedComplaintsCount * 10;

    // Clamp between 0 and 100
    trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

    await User.findByIdAndUpdate(userId, { trustScore });
  } catch (error) {
    console.error("Failed to recalculate trust score:", error.message);
  }
};

// ==========================================
// 📝 FEEDBACK CONTROLLERS
// ==========================================

// @route POST /api/v1/feedback
// Submit bug report, suggestion, complaint, or rating
exports.submitFeedback = asyncHandler(async (req, res, next) => {
  const { type, subject, description, subType, targetRollNo, rating } = req.body;
  const userId = req.user._id;

  if (!type || !subject || !description) {
    throw new ApiError(400, "Type, subject, and description are required");
  }

  const feedback = await Feedback.create({
    user: userId,
    type,
    subject,
    description,
    subType,
    targetRollNo,
    rating,
  });

  // If this feedback is a confidential rating for a seller, trigger trust score recalculation
  if (type === "rating" && targetRollNo) {
    const targetUser = await User.findOne({
      email: { $regex: `^${targetRollNo.trim()}@`, $options: "i" }
    });
    if (targetUser) {
      await recalculateTrustScore(targetUser._id);
    }
  }

  res
    .status(201)
    .json(new ApiResponse(201, feedback, "Feedback submitted successfully"));
});

// @route GET /api/v1/feedback
// Get current user's submitted feedback
exports.getMyFeedback = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const feedbacks = await Feedback.find({ user: userId }).sort({
    createdAt: -1,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, feedbacks, "My feedback retrieved successfully"),
    );
});

// @route GET /api/v1/feedback/admin
// Admin: Get all feedback submissions
exports.getAllFeedback = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "moderator") {
    throw new ApiError(403, "Unauthorized to view all feedback");
  }

  const feedbacks = await Feedback.find()
    .populate("user", "name email role")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        feedbacks,
        "All feedback submissions retrieved successfully",
      ),
    );
});

// @route PATCH /api/v1/feedback/:id
// Admin: Update feedback status
exports.updateFeedbackStatus = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "moderator") {
    throw new ApiError(403, "Unauthorized to update feedback status");
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new ApiError(404, "Feedback not found");
  }

  feedback.status = status;
  await feedback.save();

  // If this feedback is a complaint, recalculating trust scores might be necessary
  if (feedback.type === "complaint") {
    // Extract potential user IDs mentioned in description
    // For simplicity, we can recalculate trust scores for any user ID that might be mentioned
    const uuidRegex = /[0-9a-fA-F]{24}/g;
    const matches = feedback.description.match(uuidRegex) || [];
    for (const matchId of matches) {
      await recalculateTrustScore(matchId);
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, feedback, "Feedback status updated successfully"),
    );
});

// ==========================================
// ⭐ REVIEW CONTROLLERS
// ==========================================

// @route POST /api/v1/reviews
// Submit seller review for a purchased listing
exports.submitReview = asyncHandler(async (req, res, next) => {
  const { listingId, rating, comment } = req.body;
  const buyerId = req.user._id;

  if (!listingId || !rating) {
    throw new ApiError(400, "Listing ID and rating are required");
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }

  if (listing.seller.toString() === buyerId.toString()) {
    throw new ApiError(400, "You cannot review your own listing");
  }

  // Optional check: Ensure the listing is actually sold or buyer has a completed transaction
  // For robustness, we will allow reviews as long as it is not the seller themselves.

  // Check if review already exists
  const existingReview = await Review.findOne({
    listing: listingId,
    buyer: buyerId,
  });
  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this listing");
  }

  const review = await Review.create({
    listing: listingId,
    buyer: buyerId,
    seller: listing.seller,
    rating,
    comment,
  });

  // Recalculate seller's trust score
  await recalculateTrustScore(listing.seller);

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        review,
        "Review submitted successfully and trust score updated",
      ),
    );
});

// @route GET /api/v1/reviews/seller/:sellerId
// Retrieve all reviews for a seller
exports.getSellerReviews = asyncHandler(async (req, res, next) => {
  const { sellerId } = req.params;

  const reviews = await Review.find({ seller: sellerId })
    .populate("buyer", "name avatar role")
    .populate("listing", "title price")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(200, reviews, "Seller reviews retrieved successfully"),
    );
});

// @route GET /api/v1/reviews/listing/:listingId
// Retrieve review for a listing
exports.getListingReview = asyncHandler(async (req, res, next) => {
  const { listingId } = req.params;

  const review = await Review.findOne({ listing: listingId }).populate(
    "buyer",
    "name avatar role",
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, review, "Listing review retrieved successfully"),
    );
});
