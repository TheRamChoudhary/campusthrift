import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";
import useAuthStore from "../store/authStore";
import bgImage from "../assets/background_image.png";

export default function Chat() {
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = searchParams.get("conversationId") || "";

  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [typingUsers, setTypingUsers] = useState({}); // { [conversationId]: true/false }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedChatImage, setSelectedChatImage] = useState(null); // For chat image fullscreen viewer

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatFileInputRef = useRef(null);

  const emojis = ["👍", "🤝", "✅", "📍", "💰", "❤️", "❓"];

  // 1. Fetch conversations list
  const {
    data: conversations = [],
    isLoading: isLoadingConvs,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.get("/chats/conversations");
      return res.data.data;
    },
    refetchOnWindowFocus: true,
  });

  const activeConversation = conversations.find(
    (c) => c._id === activeConversationId,
  );
  const recipient = activeConversation?.recipient;

  // 2. Fetch message history when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chats/messages/${activeConversationId}`);
        setMessages(res.data.data);

        // Invalidate conversations list to clear unread badges
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load messages");
      }
    };

    fetchMessages();

    return () => {
      setMessages([]);
    };
  }, [activeConversationId, queryClient]);

  // 3. Socket.io Connection & Listeners Setup
  useEffect(() => {
    if (!token) return;

    // Socket server base URL determination
    const socketUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : window.location.origin;

    // Connect to server socket
    const socket = io(socketUrl, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Socket connected
    });

    // Listen for incoming messages
    socket.on("messageReceived", (message) => {
      // If message is for the currently open conversation, append it
      if (message.conversation === activeConversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // Mark message as read on backend via socket
        socket.emit("markAsRead", {
          conversationId: activeConversationId,
          messageIds: [message._id],
          senderId: message.sender,
        });
      } else {
        // Play notification or toast if from a different conversation
        toast(`New message from ${message.senderName || "conversation"}!`, {
          icon: "💬",
        });
      }
      // Refetch the conversations list to update previews/badges
      refetchConversations();
    });

    // Listen for sync of messages sent from other tabs/connections of the same user
    socket.on("messageSentSync", (message) => {
      if (message.conversation === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
      refetchConversations();
    });

    // Listen for messages read receipt confirmations
    socket.on("messagesRead", ({ conversationId, messageIds }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id) ? { ...msg, status: "read" } : msg,
          ),
        );
      }
    });

    // Listen for user online/offline status broadcasts
    socket.on("userStatusChange", ({ userId, status }) => {
      setOnlineStatuses((prev) => ({ ...prev, [userId]: status }));
    });

    // Listen for typing events
    socket.on("userTyping", ({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: true }));
      }
    });

    socket.on("userStopTyping", ({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: false }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeConversationId, refetchConversations]);

  // 4. Batch query online statuses of participants when conversations list changes
  useEffect(() => {
    if (conversations.length > 0 && socketRef.current) {
      const recipientIds = conversations
        .map((c) => c.recipient?._id)
        .filter(Boolean);
      if (recipientIds.length > 0) {
        socketRef.current.emit("checkOnlineUsers", recipientIds, (response) => {
          setOnlineStatuses((prev) => ({ ...prev, ...response }));
        });
      }
    }
  }, [conversations]);

  // Scroll to bottom when message log changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // 5. Send message action
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    if (!socketRef.current || !activeConversationId || !recipient) {
      toast.error("Connection not ready");
      return;
    }

    const payload = {
      conversationId: activeConversationId,
      recipientId: recipient._id,
      text: inputText.trim(),
    };

    // Stop typing immediately
    socketRef.current.emit("stopTyping", {
      conversationId: activeConversationId,
      recipientId: recipient._id,
    });

    // Send through socket with acknowledgement callback
    socketRef.current.emit("sendMessage", payload, (response) => {
      if (response && response.success) {
        setMessages((prev) => [...prev, response.message]);
        setInputText("");
        setShowEmojiPicker(false);
        refetchConversations();
      } else {
        toast.error(response?.error || "Failed to send message");
      }
    });
  };

  // 6. Handle input typing indicators
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socketRef.current || !activeConversationId || !recipient) return;

    // Emit typing indicator
    socketRef.current.emit("typing", {
      conversationId: activeConversationId,
      recipientId: recipient._id,
    });

    // Debounce stopTyping trigger
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stopTyping", {
        conversationId: activeConversationId,
        recipientId: recipient._id,
      });
    }, 1500);
  };

  // 7. Handle Image Upload & Inline Send
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size limit validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image exceeds 5MB size limit.");
      return;
    }

    const formData = new FormData();
    formData.append("images", file);

    const loadingToastId = toast.loading("Uploading photo...");
    try {
      const res = await api.post("/listings/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = res.data.data.urls[0];

      const payload = {
        conversationId: activeConversationId,
        recipientId: recipient._id,
        text: "",
        image: imageUrl,
      };

      socketRef.current.emit("sendMessage", payload, (response) => {
        toast.dismiss(loadingToastId);
        if (response && response.success) {
          setMessages((prev) => [...prev, response.message]);
          refetchConversations();
          toast.success("Photo shared successfully!");
        } else {
          toast.error(response?.error || "Failed to share photo");
        }
      });
    } catch {
      toast.dismiss(loadingToastId);
      toast.error("Image upload failed. Supports JPEG, PNG, and WebP.");
    }
  };

  // Filter conversations based on search text
  const filteredConversations = conversations.filter((c) => {
    const contactName = c.recipient?.name || "";
    const listingTitle = c.listing?.title || "";
    return (
      contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Format message status tick
  const renderMessageStatus = (msg) => {
    if (msg.sender !== user.id) return null;
    if (msg.status === "read") {
      return (
        <span
          className="text-emerald-400 font-extrabold text-xs ml-1 flex items-center select-none"
          title="Seen"
        >
          ✓✓
        </span>
      );
    } else if (msg.status === "delivered") {
      return (
        <span
          className="text-slate-400 text-xs ml-1 flex items-center select-none"
          title="Delivered"
        >
          ✓✓
        </span>
      );
    } else {
      return (
        <span
          className="text-slate-400 text-xs ml-1 flex items-center select-none"
          title="Sent"
        >
          ✓
        </span>
      );
    }
  };

  return (
    <div className="h-screen relative flex flex-col overflow-hidden text-white selection:bg-[#1DB954]/30">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      </div>
      <div className="relative z-10 flex flex-col h-screen">
        <Navbar />

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full border-t border-slate-100 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 shadow-2xl  md:rounded-b-3xl">
        {/* LEFT PANEL: Conversations Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-[380px] border-r border-slate-100 flex flex-col flex-shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 ${
            activeConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header Search area */}
          <div className="p-5 border-b border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                  <span>💬</span> Marketplace Chats
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  NIT Trichy Student Communication
                </p>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search name, listing title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] text-slate-700 font-medium placeholder-slate-400 transition"
              />
            </div>
          </div>

          {/* Conversations Scroll View */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {isLoadingConvs ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                <p className="text-[10px] font-bold uppercase">
                  Loading conversations...
                </p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-24 px-6 space-y-3">
                <span className="text-5xl block animate-bounce">📥</span>
                <p className="text-xs font-bold text-slate-700">
                  No active discussions
                </p>
                <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                  Start secure negotiations by clicking "Chat with Seller" on
                  any listing page.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv._id === activeConversationId;
                const isOnline =
                  onlineStatuses[conv.recipient?._id] === "online";
                const hasUnread =
                  conv.lastMessage &&
                  conv.lastMessage.sender !== user.id &&
                  conv.lastMessage.status !== "read";

                return (
                  <button
                    key={conv._id}
                    onClick={() =>
                      setSearchParams({ conversationId: conv._id })
                    }
                    className={`w-full text-left p-4.5 flex items-start gap-3.5 border-l-4 transition-all duration-200 ${
                      isSelected
                        ? "bg-[#388bfd]/10/40 border-indigo-600 shadow-2xl "
                        : "hover:bg-slate-50/50 border-transparent"
                    }`}
                  >
                    {/* Glowing Avatar */}
                    <div
                      className="relative flex-shrink-0 cursor-pointer hover:scale-105 transition"
                      onClick={(e) => {
                        if (conv.recipient?.avatar) {
                          e.stopPropagation(); // Prevent opening the conversation on click
                          setSelectedChatImage(conv.recipient.avatar);
                        }
                      }}
                      title="View Profile Photo"
                    >
                      {conv.recipient?.avatar ? (
                        <img
                          src={conv.recipient.avatar}
                          alt={conv.recipient.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200/50 shadow-2xl"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center font-bold text-sm text-[#58a6ff] uppercase shadow-2xl ">
                          {conv.recipient?.name?.[0] || "?"}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-2xl  transition-colors duration-300 ${
                          isOnline
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-slate-300"
                        }`}
                      />
                    </div>

                    {/* Metadata Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs truncate ${hasUnread ? "text-slate-900 font-extrabold" : "text-slate-700 font-bold"}`}
                        >
                          {conv.recipient?.name || "Student Seller"}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-[9px] text-slate-400 font-semibold font-mono flex-shrink-0">
                            {new Date(
                              conv.lastMessage.createdAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Listing card thumbnail badge */}
                      {conv.listing && (
                        <span className="inline-block max-w-full text-[9px] font-extrabold text-[#58a6ff] bg-[#388bfd]/10 border border-indigo-100/30 px-2 py-0.5 rounded-lg truncate">
                          🏷️ {conv.listing.title} · ₹
                          {conv.listing.price.toLocaleString("en-IN")}
                        </span>
                      )}

                      {/* Last Message Preview */}
                      <p
                        className={`text-[11px] truncate flex items-center gap-1 ${
                          hasUnread
                            ? "text-slate-900 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        {conv.lastMessage?.sender === user.id && (
                          <span className="text-[9px] text-slate-400 font-bold">
                            You:
                          </span>
                        )}
                        {conv.lastMessage?.image
                          ? "📷 Shared a photo"
                          : conv.lastMessage?.text ||
                            "Initialized conversation."}
                      </p>
                    </div>

                    {/* Numerical Unread Badge indicator */}
                    {hasUnread && (
                      <span className="flex-shrink-0 self-center bg-[#238636] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-xl  border border-indigo-500/25 animate-scaleUp">
                        1
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat Viewport */}
        <div
          className={`flex-1 bg-transparent flex flex-col overflow-hidden transition-all duration-300 ${
            !activeConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversationId && recipient ? (
            <>
              {/* HEADER VIEWPORT */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-2xl  z-10 flex-shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Mobile Back button */}
                  <button
                    onClick={() => setSearchParams({})}
                    className="md:hidden text-slate-400 hover:text-[#58a6ff] font-bold p-1 bg-slate-50 hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-1.5 transition"
                  >
                    ←
                  </button>

                  <div
                    className="relative flex-shrink-0 cursor-pointer hover:scale-105 transition"
                    onClick={() => {
                      if (recipient.avatar) {
                        setSelectedChatImage(recipient.avatar);
                      }
                    }}
                    title="View Profile Photo"
                  >
                    {recipient.avatar ? (
                      <img
                        src={recipient.avatar}
                        alt={recipient.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-250/20 shadow-xl"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-sm text-white uppercase shadow-xl ">
                        {recipient.name?.[0] || "?"}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-2xl  transition-colors duration-300 ${
                        onlineStatuses[recipient._id] === "online"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-slate-100 text-xs sm:text-sm truncate leading-none">
                        {recipient.name}
                      </h3>
                      {recipient.role && recipient.role !== "student" && (
                        <span className="bg-purple-100 text-purple-700 font-black text-[8px] px-2 py-0.5 rounded border border-purple-200 uppercase tracking-widest leading-none">
                          {recipient.role}
                        </span>
                      )}
                    </div>

                    {/* Glowing Online indicator label */}
                    <div className="flex items-center gap-1.5 mt-1.5 leading-none">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${onlineStatuses[recipient._id] === "online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                      ></span>
                      <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
                        {onlineStatuses[recipient._id] === "online"
                          ? "Online Now"
                          : "Offline / Last Seen"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rightmost Product mini badge */}
                {activeConversation.listing && (
                  <Link
                    to={`/listings/${activeConversation.listing._id}`}
                    className="hidden sm:flex items-center gap-3 border border-slate-100 bg-slate-50/50 hover:bg-[#388bfd]/10/20 hover:border-indigo-100 transition-all rounded-2xl p-2.5 max-w-[260px] text-left shadow-2xl "
                  >
                    {activeConversation.listing.images?.[0] ? (
                      <img
                        src={activeConversation.listing.images[0]}
                        alt={activeConversation.listing.title}
                        className="w-9 h-9 rounded-xl object-cover flex-shrink-0 shadow-inner"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                        📦
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-200 truncate leading-snug">
                        {activeConversation.listing.title}
                      </p>
                      <p className="text-[10px] font-extrabold text-[#58a6ff] mt-0.5 font-mono">
                        ₹
                        {activeConversation.listing.price.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </Link>
                )}
              </div>

              {/* TIMELINE WINDOW */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent">
                {/* Floating Product Preview Banner inside active viewport */}
                {activeConversation.listing && (
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/80 backdrop-blur-sm border border-slate-100 rounded-3xl p-4.5 flex gap-4 shadow-2xl  items-center max-w-xl mx-auto mb-6 transform hover:scale-[1.01] transition duration-200">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-inner">
                      {activeConversation.listing.images?.[0] ? (
                        <img
                          src={activeConversation.listing.images[0]}
                          alt={activeConversation.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl text-center block leading-[4rem]">
                          📦
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/listings/${activeConversation.listing._id}`}
                          className="text-xs font-black text-slate-200 truncate hover:text-[#58a6ff] transition"
                        >
                          {activeConversation.listing.title}
                        </Link>
                        <span className="bg-[#388bfd]/10 text-indigo-700 font-extrabold text-[8px] px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-widest">
                          {activeConversation.listing.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#58a6ff] font-mono">
                        ₹
                        {activeConversation.listing.price.toLocaleString(
                          "en-IN",
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Negotiating as a student of NIT Trichy.
                      </p>
                    </div>
                  </div>
                )}

                {/* 7-Day Purge Audit Banner */}
                <div className="flex justify-center my-3">
                  <div className="bg-slate-100 border border-slate-200/40 rounded-full px-4.5 py-1.5 text-[9px] text-slate-400 font-bold flex items-center gap-1.5 shadow-2xl  font-sans uppercase tracking-wider">
                    <span>🔒 Secured Room</span>
                    <span>·</span>
                    <span>Purged every 7 days</span>
                  </div>
                </div>

                {/* Message list rendering */}
                {messages.length === 0 ? (
                  <div className="text-center py-20 px-6 max-w-xs mx-auto space-y-2">
                    <span className="text-4xl block animate-pulse">👋</span>
                    <h4 className="text-xs font-bold text-slate-700">
                      Send a negotiating greet!
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Arranging asset exchange or price offers starts here.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMyMessage = msg.sender === user.id;
                    const formattedTime = new Date(
                      msg.createdAt,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg._id || index}
                        className={`flex gap-2.5 max-w-[80%] ${
                          isMyMessage
                            ? "ml-auto justify-end"
                            : "mr-auto justify-start"
                        }`}
                      >
                        <div className="flex flex-col max-w-full">
                          {/* Bubble Container */}
                          <div
                            className="relative px-4 py-3 rounded-2xl text-sm sm:text-base font-semibold leading-relaxed break-words whitespace-pre-wrap shadow-2xl border border-emerald-700/10 transition-transform duration-150 hover:scale-[1.005] bg-[#238636] text-white"
                          >
                            {/* Rendering image messages if shared */}
                            {msg.image ? (
                              <div
                                onClick={() => setSelectedChatImage(msg.image)}
                                className="w-48 sm:w-64 max-h-48 rounded-xl overflow-hidden cursor-zoom-in bg-slate-950 border border-black/10 shadow-inner mb-2"
                              >
                                <img
                                  src={msg.image}
                                  alt="Shared Media"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : null}

                            {/* Render product card inline if message is a listing inquiry */}
                            {msg.listing && (
                              <div className="bg-slate-950/20 backdrop-blur-sm rounded-xl p-2.5 mb-2 flex gap-2.5 border border-white/5 select-none text-white max-w-[280px]">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-white/5">
                                  {msg.listing.images?.length > 0 ? (
                                    <img
                                      src={msg.listing.images[0]}
                                      alt={msg.listing.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px]">
                                      📦
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to={`/listings/${msg.listing._id}`}
                                    className="text-[11px] font-bold text-white hover:underline transition truncate block"
                                  >
                                    {msg.listing.title}
                                  </Link>
                                  <p className="text-xs font-extrabold text-emerald-350 mt-0.5">
                                    ₹{msg.listing.price?.toLocaleString("en-IN")}
                                  </p>
                                  <span className="text-[7px] font-bold uppercase tracking-widest bg-white/10 text-white px-1.5 py-0.5 rounded mt-1 inline-block">
                                    {msg.listing.status}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Render text text if exists */}
                            {msg.text && (
                              <p className="font-sans pr-10">{msg.text}</p>
                            )}

                            {/* Time & Receipt status inside bottom right absolute */}
                            <div className="absolute bottom-1 right-2.5 flex items-center gap-1 mt-1 text-[9px] font-mono font-bold select-none opacity-80">
                              <span className="text-white/80">
                                {formattedTime}
                              </span>
                              {isMyMessage && renderMessageStatus(msg)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Bouncing Typing Animation indicator */}
                {typingUsers[activeConversationId] && (
                  <div className="flex items-center gap-2.5 mr-auto max-w-[80%] animate-scaleUp">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border flex items-center justify-center text-[10px] text-[#8b949e] font-bold uppercase">
                      {recipient.name?.[0]}
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-2xl  flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT PANEL TRAY */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 border-t border-slate-100 p-4.5 z-10 flex-shrink-0 space-y-3">
                {/* Micro Emoji interactive popover */}
                {showEmojiPicker && (
                  <div className="flex gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl animate-scaleUp shadow-inner justify-around max-w-sm">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-base hover:scale-125 transition-transform duration-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 items-center">
                  {/* File share button */}
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                    title="Share Image"
                  >
                    📁
                  </button>
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {/* Smiley Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                    title="Insert Emojis"
                  >
                    😀
                  </button>

                  {/* Typing input bar */}
                  <form
                    onSubmit={handleSendMessage}
                    className="flex-1 flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Type a message to negotiate..."
                      value={inputText}
                      onChange={handleInputChange}
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4.5 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] focus:bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 text-slate-200 transition font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="bg-[#238636] hover:bg-[#2ea043] text-white font-bold px-5.5 rounded-xl transition duration-200 shadow-xl  hover:shadow-indigo-500/25 flex items-center justify-center flex-shrink-0 disabled:opacity-40 text-xs tracking-wider"
                    >
                      🚀 Send
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            /* EMPTY VIEW */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
              <span className="text-6xl animate-pulse">💬</span>
              <h3 className="text-lg font-black text-slate-100">
                Direct Student Messaging Hub
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Arrange exchanges, lock pricing, and share item previews.
                Complete end-to-end communication verified under `@nitt.edu`
                directories.
              </p>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 border border-slate-100 rounded-3xl p-5 text-left shadow-2xl  space-y-3 w-full">
                <h4 className="text-[10px] font-black text-[#58a6ff] uppercase tracking-widest">
                  Marketplace Protocols
                </h4>
                <div className="space-y-2.5 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>JWT security authorization gates.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Strict 7-day automatic data cleanup policy.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Real-time online indicators & seen ticks.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN SHARED PHOTO VIEWER LIGHTBOX */}
      {selectedChatImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={() => setSelectedChatImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/10 hover:bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/20 transition flex items-center justify-center text-white text-xl font-bold font-sans"
            title="Close Lightbox"
          >
            ×
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden flex items-center justify-center">
            <img
              src={selectedChatImage}
              alt="Expanded Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
