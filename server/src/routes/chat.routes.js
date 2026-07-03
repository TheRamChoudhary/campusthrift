const express = require("express");
const router = express.Router();
const {
  getConversations,
  getMessages,
  startConversation,
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.use(protect); // Secure all chat routes

router.get("/conversations", getConversations);
router.get("/messages/:conversationId", getMessages);
router.post("/conversations", startConversation);

router.post("/block", blockUser);
router.post("/unblock", unblockUser);
router.get("/blocked", getBlockedUsers);

module.exports = router;
