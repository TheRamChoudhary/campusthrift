const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const onlineUsers = new Map(); // Map to store userId -> Set(socket.id)

const initChatSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // JWT Socket Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error("Authentication failed: Token is missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication failed: User no longer exists"));
      }

      if (user.isBlocked) {
        return next(
          new Error("Authentication failed: Your account is blocked"),
        );
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication failed: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(
      `🔌 Student Connected to Chat Socket: ${socket.user.name} (${userId})`,
    );

    // Add connection to online pool
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join their own private room for direct messages
    socket.join(userId);

    // Broadcast online status to everyone
    io.emit("userStatusChange", { userId, status: "online" });

    // Handle initial client join to check who is online
    socket.on("checkOnlineUsers", (userIds, callback) => {
      if (typeof callback === "function") {
        const statuses = {};
        userIds.forEach((id) => {
          statuses[id] = onlineUsers.has(id.toString()) ? "online" : "offline";
        });
        callback(statuses);
      }
    });

    // Handle typing indicators
    socket.on("typing", ({ conversationId, recipientId }) => {
      socket.to(recipientId.toString()).emit("userTyping", {
        conversationId,
        senderId: userId,
      });
    });

    socket.on("stopTyping", ({ conversationId, recipientId }) => {
      socket.to(recipientId.toString()).emit("userStopTyping", {
        conversationId,
        senderId: userId,
      });
    });

    // Handle real-time messaging
    socket.on("sendMessage", async (data, callback) => {
      const { conversationId, recipientId, text, image } = data;

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (typeof callback === "function")
            callback({ success: false, error: "Conversation not found" });
          return;
        }

        // Check if either user has blocked the other
        const sender = await User.findById(userId);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) {
          if (typeof callback === "function")
            callback({
              success: false,
              error: "Sender or recipient not found",
            });
          return;
        }

        if (
          (sender.blockedUsers &&
            sender.blockedUsers.some(
              (id) => id.toString() === recipientId.toString(),
            )) ||
          (recipient.blockedUsers &&
            recipient.blockedUsers.some(
              (id) => id.toString() === userId.toString(),
            ))
        ) {
          if (typeof callback === "function")
            callback({ success: false, error: "Communication is blocked" });
          return;
        }

        // Create message in database
        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          recipient: recipientId,
          text: text || "",
          image: image || "",
          status: onlineUsers.has(recipientId.toString())
            ? "delivered"
            : "sent",
        });

        // Update conversation's lastMessage reference
        conversation.lastMessage = message._id;
        await conversation.save();

        const messageData = message.toObject();




        // Broadcast to recipient room (if online) and sender's other socket connections
        socket.to(recipientId.toString()).emit("messageReceived", messageData);

        // Broadcast back to sender's own private room (to sync across multiple browser tabs)
        socket.to(userId).emit("messageSentSync", messageData);

        if (typeof callback === "function") {
          callback({ success: true, message: messageData });
        }
      } catch (err) {
        console.error("❌ Error sending message in socket:", err.message);
        if (typeof callback === "function")
          callback({ success: false, error: err.message });
      }
    });

    // Handle message read receipts
    socket.on(
      "markAsRead",
      async ({ conversationId, messageIds, senderId }) => {
        try {
          await Message.updateMany(
            { _id: { $in: messageIds }, recipient: userId },
            { status: "read" },
          );

          // Notify original sender that their messages were read
          socket.to(senderId.toString()).emit("messagesRead", {
            conversationId,
            messageIds,
            readBy: userId,
          });
        } catch (err) {
          console.error(
            "❌ Error marking messages read in socket:",
            err.message,
          );
        }
      },
    );

    // Handle Disconnect
    socket.on("disconnect", () => {
      console.log(
        `🔌 Student Disconnected from Chat Socket: ${socket.user.name}`,
      );
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast that the user went offline
          io.emit("userStatusChange", { userId, status: "offline" });
        }
      }
    });
  });

  return io;
};

module.exports = initChatSocket;
