const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  submitReview,
  getSellerReviews,
  getListingReview,
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/auth");

// ==========================================
// 📝 FEEDBACK ROUTES
// ==========================================
router.post("/feedback", protect, submitFeedback);
router.get("/feedback", protect, getMyFeedback);
router.get("/feedback/admin", protect, getAllFeedback);
router.patch("/feedback/:id", protect, updateFeedbackStatus);

// ==========================================
// ⭐ REVIEW ROUTES
// ==========================================
router.post("/reviews", protect, submitReview);
router.get("/reviews/seller/:sellerId", getSellerReviews);
router.get("/reviews/listing/:listingId", getListingReview);

module.exports = router;
