const express = require("express");
const router = express.Router();
const {
  processPayment,
  topupWallet,
  getTransactionHistory,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.use(protect); // Secure all payment routes

router.post("/pay", processPayment);
router.post("/topup", topupWallet);
router.get("/history", getTransactionHistory);

module.exports = router;
