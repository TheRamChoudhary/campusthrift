const express = require("express");
const router = express.Router();
const {
  createCheckoutSession,
  verifyDirectPayment,
  handleStripeWebhook,
} = require("../controllers/stripeController");
const { protect } = require("../middleware/auth");

// Public Webhook (Stripe signs it)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// Protected routes
router.post("/create-checkout", protect, createCheckoutSession);
router.post("/verify", protect, verifyDirectPayment);

module.exports = router;
