const express = require("express");
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  toggleBlockUser,
  getAuditLogs,
  deleteListingModerator,
  createSpecialAccount,
} = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

router.use(protect); // Secure all admin routes

// Moderator and Admin access
router.get("/analytics", restrictTo("admin", "moderator"), getAnalytics);
router.get("/users", restrictTo("admin", "moderator"), getUsers);
router.delete(
  "/listings/:id",
  restrictTo("admin", "moderator"),
  deleteListingModerator,
);

// Strict Admin Only access
router.put("/users/:id/toggle-block", restrictTo("admin"), toggleBlockUser);
router.get("/audit-logs", restrictTo("admin"), getAuditLogs);
router.post(
  "/create-special-account",
  restrictTo("admin"),
  createSpecialAccount,
);

module.exports = router;
