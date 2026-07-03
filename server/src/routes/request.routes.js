const express = require("express");
const router = express.Router();
const {
  createRequest,
  getBuyerRequests,
  getSellerRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/requestController");
const { protect } = require("../middleware/auth");

router.post("/", protect, createRequest);
router.get("/buyer", protect, getBuyerRequests);
router.get("/seller", protect, getSellerRequests);
router.put("/:id/approve", protect, approveRequest);
router.put("/:id/reject", protect, rejectRequest);

module.exports = router;
