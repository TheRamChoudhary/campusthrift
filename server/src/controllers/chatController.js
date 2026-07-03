const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Listing = require("../models/Listing");
const User = require("../models/User");
const cron = require("node-cron");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @route GET /api/v1/chats/conversations
// Retrieve conversations list for the current user
exports.getConversations = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "name email avatar isVerified role")
    .populate({
      path: "listing",
      select: "title price images status seller",
    })
    .populate({
      path: "lastMessage",
      select: "text image sender recipient status createdAt",
    })
    .sort({ updatedAt: -1 });

  // Filter out the current user from the participants array of each conversation object in output
  const formatted = conversations.map((c) => {
    const obj = c.toObject();
    obj.recipient = obj.participants.find(
      (p) => p._id.toString() !== userId.toString(),
    );
    delete obj.participants;
    return obj;
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, formatted, "Conversations fetched successfully"),
    );
});

// @route GET /api/v1/chats/messages/:conversationId
// Fetch chat message history for a conversation
exports.getMessages = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  if (
    !conversation.participants.some((p) => p.toString() === userId.toString())
  ) {
    throw new ApiError(
      403,
      "You are not authorized to access this conversation",
    );
  }

  // Mark all unread messages received by this user in this conversation as 'read'
  await Message.updateMany(
    {
      conversation: conversationId,
      recipient: userId,
      status: { $ne: "read" },
    },
    { status: "read" },
  );

  const messages = await Message.find({ conversation: conversationId }).sort({
    createdAt: 1,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, messages, "Message history fetched successfully"),
    );
});

// @route POST /api/v1/chats/conversations
// Initialize a chat session between buyer and seller anchor to a product listing
exports.startConversation = asyncHandler(async (req, res, next) => {
  const { recipientId, listingId } = req.body;
  const senderId = req.user._id;

  if (!recipientId) {
    throw new ApiError(400, "Recipient ID is required");
  }

  if (recipientId.toString() === senderId.toString()) {
    throw new ApiError(400, "You cannot chat with yourself");
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new ApiError(404, "Recipient user not found");
  }

  // Check if conversation already exists for this listing and participants
  let query = {
    participants: { $all: [senderId, recipientId] },
  };
  if (listingId) {
    query.listing = listingId;
  }

  let conversation = await Conversation.findOne(query);

  if (!conversation) {
    // Check if either user has blocked the other
    const sender = await User.findById(senderId);
    const recipientUser = await User.findById(recipientId);

    if (
      (sender.blockedUsers && sender.blockedUsers.includes(recipientId)) ||
      (recipientUser.blockedUsers &&
        recipientUser.blockedUsers.includes(senderId))
    ) {
      throw new ApiError(
        400,
        "Cannot start conversation. Communication is blocked.",
      );
    }

    conversation = await Conversation.create({
      participants: [senderId, recipientId],
      listing: listingId || undefined,
    });
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, conversation, "Conversation started successfully"),
    );
});

// @route POST /api/v1/chats/block
// Block a user from messaging
exports.blockUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID to block is required");
  }

  if (userId.toString() === currentUserId.toString()) {
    throw new ApiError(400, "You cannot block yourself");
  }

  const userToBlock = await User.findById(userId);
  if (!userToBlock) {
    throw new ApiError(404, "User to block not found");
  }

  // Find current user and push to blockedUsers if not already there
  const currentUser = await User.findById(currentUserId);
  if (!currentUser.blockedUsers) {
    currentUser.blockedUsers = [];
  }

  if (
    !currentUser.blockedUsers.some((id) => id.toString() === userId.toString())
  ) {
    currentUser.blockedUsers.push(userId);
    await currentUser.save();
  }

  res.status(200).json(new ApiResponse(200, null, "User blocked successfully"));
});

// @route POST /api/v1/chats/unblock
// Unblock a user
exports.unblockUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID to unblock is required");
  }

  const currentUser = await User.findById(currentUserId);
  if (currentUser.blockedUsers) {
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== userId.toString(),
    );
    await currentUser.save();
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "User unblocked successfully"));
});

// @route GET /api/v1/chats/blocked
// Get all blocked users
exports.getBlockedUsers = asyncHandler(async (req, res, next) => {
  const currentUser = await User.findById(req.user._id).populate(
    "blockedUsers",
    "name email avatar role",
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        currentUser.blockedUsers || [],
        "Blocked users fetched successfully",
      ),
    );
});

// ==========================================
// 📅 AUTOMATIC CHAT CLEANUP JOB (node-cron)
// Purge conversations & messages inactive for 7 days daily at midnight
// ==========================================
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Starting Scheduled Chat Purge (7 Days Inactivity Policy)...");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // Find conversations inactive for 7 days
    const inactiveConversations = await Conversation.find({
      updatedAt: { $lt: sevenDaysAgo },
    });

    if (inactiveConversations.length > 0) {
      const convIds = inactiveConversations.map((c) => c._id);

      // Delete all messages belonging to these inactive conversations
      const msgResult = await Message.deleteMany({
        conversation: { $in: convIds },
      });

      // Delete the conversations themselves
      const convResult = await Conversation.deleteMany({
        _id: { $in: convIds },
      });

      console.log(
        `🧹 Chat Purge Completed: Deleted ${convResult.deletedCount} inactive conversations and ${msgResult.deletedCount} associated messages.`,
      );
    } else {
      console.log(`🧹 Chat Purge: No inactive conversations to clean up.`);
    }
  } catch (error) {
    console.error("❌ Chat Purge Failed:", error.message);
  }
});
