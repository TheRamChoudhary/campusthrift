import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";
import useAuthStore from "../store/authStore";
import { LISTING_CATEGORIES } from "../utils/constants";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  // 1. Fetch listing details
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return res.data.data;
    },
  });

  // User Profile for wishlist checks
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.data;
    },
    enabled: !!user,
  });

  const isWishlisted = profile?.wishlist?.some(
    (item) =>
      item === id ||
      item._id === id ||
      (typeof item === "object" && item._id === id),
  );

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/listings/${id}/wishlist`);
      return res.data.data;
    },
    onSuccess: (resData) => {
      toast.success(
        resData.isWishlisted
          ? "Added to wishlist! ❤️"
          : "Removed from wishlist! 💔",
      );
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to toggle wishlist");
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/listings/${id}/report`, {
        description: reportDescription,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Listing reported successfully. Admin will review.");
      setIsReportModalOpen(false);
      setReportDescription("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit report");
    },
  });

  // Similar Products Query
  const { data: similarListings } = useQuery({
    queryKey: ["similar-listings", data?.category, id],
    queryFn: async () => {
      const res = await api.get(
        `/listings?category=${encodeURIComponent(data?.category)}`,
      );
      return res.data.data.listings.filter((l) => l._id !== id).slice(0, 4);
    },
    enabled: !!data?.category,
  });

  // Recently Viewed Logic
  useEffect(() => {
    if (data) {
      const viewed = JSON.parse(
        localStorage.getItem("recently-viewed") || "[]",
      );

      if (data.status === "available") {
        // Add to recently viewed if available
        const updated = [
          {
            _id: data._id,
            title: data.title,
            price: data.price,
            category: data.category,
            condition: data.condition,
            images: data.images,
            seller: data.seller,
          },
          ...viewed.filter((item) => item._id !== data._id),
        ].slice(0, 4);
        localStorage.setItem("recently-viewed", JSON.stringify(updated));
      } else {
        // Remove from recently viewed if sold/reserved
        const updated = viewed.filter((item) => item._id !== data._id);
        localStorage.setItem("recently-viewed", JSON.stringify(updated));
      }
    }
  }, [data]);

  // Form for editing listing
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
  });

  // Keyboard navigation for fullscreen photo viewer
  useEffect(() => {
    if (!isFullscreenModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreenModalOpen(false);
      if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev + 1) % (data?.images?.length || 1));
      }
      if (e.key === "ArrowLeft") {
        setActiveImageIndex(
          (prev) =>
            (prev - 1 + (data?.images?.length || 1)) %
            (data?.images?.length || 1),
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreenModalOpen, data?.images?.length]);

  // 2. Fetch buyer requests
  const { data: myRequests } = useQuery({
    queryKey: ["my-requests-buyer"],
    queryFn: async () => {
      const res = await api.get("/requests/buyer");
      return res.data.data;
    },
    enabled: !!user,
  });

  const myRequestForListing = myRequests?.find(
    (r) => r.listing?._id === id || r.listing === id,
  );
  const alreadyRequested = !!myRequestForListing;
  const isRequestApproved = myRequestForListing?.status === "approved";

  // Strict Ownership Comparison: populated seller ID vs logged-in user id
  const isSeller = user && data?.seller?._id === user.id;

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/requests", { listingId: id, message });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Request sent! The seller will be notified.");
      queryClient.invalidateQueries({ queryKey: ["my-requests-buyer"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to send request");
    },
  });

  const startChatMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/chats/conversations", {
        recipientId: data?.seller?._id,
        listingId: id,
      });
      return res.data.data;
    },
    onSuccess: (chat) => {
      toast.success("Chat session initialized!");
      navigate(`/chat?conversationId=${chat._id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to start chat");
    },
  });

  // Seller Action Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const res = await api.put(`/listings/${id}`, { status: newStatus });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(`Listing marked as ${res.data.status}!`);
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Failed to update listing status",
      );
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.put(`/listings/${id}`, formData);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Listing details updated successfully!");
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Failed to update listing details",
      );
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/listings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Listing deleted successfully!");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete listing");
    },
  });

  const toggleBlockSellerMutation = useMutation({
    pointer: "toggleBlock",
    mutationFn: async () => {
      const res = await api.put(`/admin/users/${data?.seller?._id}/toggle-block`);
      return res.data;
    },
    onSuccess: (resData) => {
      toast.success(resData.message || "Seller status updated successfully!");
      // Invalidate globally to remove blocked user's items from all screens immediately
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Failed to update seller block status",
      );
    },
  });

  const statusColors = {
    available: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    reserved: "bg-amber-100 text-amber-800 border border-amber-200",
    sold: "bg-rose-100 text-rose-800 border border-rose-200",
  };

  const conditionLabels = {
    new: "Brand New (🆕)",
    "like-new": "Like New (✨)",
    good: "Good Condition (👍)",
    fair: "Fair Condition (🩹)",
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-gray-400 font-semibold text-sm">
            Loading product details...
          </p>
        </div>
      </div>
    );

  const isSuspendedError = error?.response?.status === 403;

  if (isError || !data)
    return (
      <div className="min-h-screen bg-transparent">
        <Navbar />
        <div className="text-center py-32 px-4 max-w-md mx-auto">
          <span className="text-6xl block mb-4">{isSuspendedError ? "🚫" : "🔍"}</span>
          <h2 className="text-xl font-bold text-[#c9d1d9]">
            {isSuspendedError ? "Seller Suspended" : "Listing Not Found"}
          </h2>
          <p className="text-gray-400 text-xs mt-2 leading-relaxed">
            {isSuspendedError
              ? error.response?.data?.message || "This listing is unavailable because the seller has been blocked."
              : "This product might have been deleted by the seller or moderated by the admin team."}
          </p>
          <button
            onClick={() => navigate("/marketplace")}
            className="mt-6 bg-[#238636] hover:bg-[#2ea043] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition duration-200 shadow-xl "
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );

  const mediaItems = data
    ? [
        ...(data.images || []).map((url) => ({ type: "image", url })),
        ...(data.video ? [{ type: "video", url: data.video }] : []),
      ]
    : [];

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Main Grid: Images Column + Details Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Product Image Carousel & Thumbnails */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl border border-slate-100/80 shadow-2xl  p-5 space-y-4">
            {/* Aspect-ratio Locked Main Image viewport */}
            <div
              onClick={() => {
                const activeMedia = mediaItems[activeImageIndex];
                if (activeMedia && activeMedia.type === "image") {
                  setIsFullscreenModalOpen(true);
                }
              }}
              className={`relative aspect-video rounded-2xl overflow-hidden bg-transparent flex items-center justify-center shadow-inner ${
                mediaItems[activeImageIndex]?.type === "image" ? "cursor-zoom-in group" : ""
              }`}
            >
              {mediaItems.length > 0 ? (
                mediaItems[activeImageIndex]?.type === "video" ? (
                  <video
                    src={mediaItems[activeImageIndex]?.url}
                    controls
                    className="w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={mediaItems[activeImageIndex]?.url}
                    alt={data.title}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                )
              ) : (
                <span className="text-9xl">📦</span>
              )}

              {/* Hover Overlay */}
              {mediaItems[activeImageIndex]?.type === "image" && (
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/90 backdrop-blur-sm text-slate-100 px-4 py-2 rounded-xl text-xs font-bold shadow-xl  flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    🔍 Click for Fullscreen Preview
                  </span>
                </div>
              )}

              {/* Image Counter Indicator */}
              {mediaItems.length > 0 && (
                <span className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider font-mono">
                  {activeImageIndex + 1} / {mediaItems.length}
                </span>
              )}
            </div>

            {/* Thumbnail Slider */}
            {mediaItems.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {mediaItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden bg-transparent flex-shrink-0 border-2 transition-all duration-200 ${
                      i === activeImageIndex
                        ? "border-indigo-500 ring-2 ring-[#58a6ff]/20 scale-95 shadow-2xl "
                        : "border-transparent hover:border-indigo-200"
                    }`}
                  >
                    {item.type === "video" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-850 text-white gap-1 select-none">
                        <span className="text-lg">🎥</span>
                        <span className="text-[7px] uppercase tracking-wider font-extrabold text-white/90">Video</span>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`Thumbnail ${i}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details, Seller Bio, & Request Flow */}
          <div className="lg:col-span-5 space-y-6">
            {/* Core Listing Details Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl border border-slate-100/80 shadow-2xl  p-6 space-y-4">
              {/* Category & Status Row */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#58a6ff] bg-[#388bfd]/10 px-3 py-1 rounded-full">
                  {data.category}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusColors[data.status] || "bg-slate-100 text-slate-600"}`}
                >
                  {data.status}
                </span>
              </div>
              {data.createdAt && (
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-1">
                  Listed on {new Date(data.createdAt).toLocaleDateString()}
                </p>
              )}

              {/* Title & Price */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-snug">
                    {data.title}
                  </h1>
                  <p className="text-3xl font-black text-[#58a6ff] mt-2 tracking-tight">
                    ₹{data.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!user) {
                      toast("Please login to wishlist items", { icon: "🔒" });
                      navigate("/login");
                      return;
                    }
                    toggleWishlistMutation.mutate();
                  }}
                  disabled={toggleWishlistMutation.isPending}
                  className={`p-3 rounded-2xl border transition-all duration-200 flex-shrink-0 flex items-center justify-center ${
                    isWishlisted
                      ? "bg-rose-50 border-rose-100 text-rose-500 scale-105 shadow-2xl  hover:bg-rose-100"
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50/30"
                  }`}
                  title={
                    isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                  }
                >
                  <span className="text-lg transition-transform duration-200 hover:scale-110">
                    ❤️
                  </span>
                </button>
              </div>

              {/* Condition & Specific tags */}
              <div className="flex gap-2 flex-wrap pt-2">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3.5 py-1 rounded-full border border-blue-100">
                  🛡️ {conditionLabels[data.condition] || data.condition}
                </span>
                {data.tags &&
                  data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>

              <div className="border-t border-slate-50 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Item Description
                </h3>
                <p className="text-[#8b949e] text-sm leading-relaxed whitespace-pre-wrap">
                  {data.description}
                </p>
              </div>
            </div>

            {/* Seller profile & Trust Score Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl border border-slate-100/80 shadow-2xl  p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isSeller ? "Your Profile (Public View)" : "Seller Profile"}
              </h3>

              <div className="flex items-center gap-4">
                {data.seller?.avatar ? (
                  <img
                    src={data.seller.avatar}
                    alt={data.seller.name}
                    onClick={() => setSelectedAvatar(data.seller.avatar)}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200/50 shadow-xl flex-shrink-0 cursor-zoom-in hover:opacity-90 transition"
                    title="View Profile Photo"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base uppercase shadow-xl  flex-shrink-0">
                    {data.seller?.name?.[0] || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-slate-100 text-sm truncate">
                    {isSeller ? `${data.seller?.name} (You)` : data.seller?.name}
                  </p>
                  <p className="text-xs text-gray-450 truncate mt-0.5 font-medium">
                    {data.seller?.email}
                  </p>
                </div>
              </div>

              {/* Optional College & Profile details */}
              {(data.seller?.bio || data.seller?.department || data.seller?.branch || data.seller?.hostel || data.seller?.phone) && (
                <div className="border-t border-slate-100/80 pt-3 space-y-1.5 text-xs">
                  {data.seller?.bio && (
                    <p className="text-slate-600 italic leading-relaxed">
                      "{data.seller.bio}"
                    </p>
                  )}
                  {(data.seller?.department || data.seller?.branch) && (
                    <p className="text-slate-500 font-medium">
                      🎓 {data.seller.department}{data.seller.branch ? ` (${data.seller.branch})` : ""}
                    </p>
                  )}
                  {data.seller?.hostel && (
                    <p className="text-slate-500 font-medium">
                      🏠 Hostel: {data.seller.hostel}
                    </p>
                  )}
                  {data.seller?.phone && (
                    <p className="text-slate-500 font-medium font-mono text-[11px]">
                      📞 Contact: {data.seller.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Trust Score Progress Bar Integration */}
              <div className="bg-[#388bfd]/10/50 border border-indigo-100/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-700">
                    {isSeller ? "Your Trust Level" : "Seller Trust Level"}
                  </span>
                  <span className="font-black text-[#58a6ff] font-mono">
                    🌟 {data.seller?.trustScore || 100} / 100
                  </span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="bg-[#238636] h-full rounded-full transition-all duration-500"
                    style={{ width: `${data.seller?.trustScore || 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  {isSeller
                    ? "Keep your score high by communicating and resolving transactions quickly!"
                    : "Weighted community reviews & resolution records."}
                </p>
              </div>
            </div>

            {/* ACTION AREA: Seller vs Buyer logic */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl border border-slate-100/80 shadow-2xl  p-6">
              {isSeller ? (
                /* SELLER CONTROLS */
                <div className="space-y-4">
                  <div className="bg-[#388bfd]/10 text-indigo-700 text-xs font-bold px-4 py-3 rounded-2xl text-center flex items-center justify-center gap-1.5">
                    <span>📋</span>
                    <span>
                      You own this listing. Access seller commands below.
                    </span>
                  </div>

                  {/* Status Toggle buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateStatusMutation.mutate("available")}
                      disabled={
                        data.status === "available" ||
                        updateStatusMutation.isPending
                      }
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 disabled:opacity-40 disabled:hover:bg-emerald-50 border border-emerald-100 font-bold py-3 rounded-xl text-xs transition duration-200"
                    >
                      Available
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate("sold")}
                      disabled={
                        data.status === "sold" || updateStatusMutation.isPending
                      }
                      className="bg-rose-50 hover:bg-rose-100 text-rose-800 disabled:opacity-40 disabled:hover:bg-rose-50 border border-rose-100 font-bold py-3 rounded-xl text-xs transition duration-200"
                    >
                      Mark Sold
                    </button>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditForm({
                          title: data.title || "",
                          description: data.description || "",
                          price: data.price || "",
                          category: data.category || "",
                          condition: data.condition || "",
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition duration-200"
                    >
                      ✏️ Edit Listing Details
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this product permanently? This cannot be undone.",
                          )
                        ) {
                          deleteListingMutation.mutate();
                        }
                      }}
                      disabled={deleteListingMutation.isPending}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-xl  hover:shadow-rose-500/20 disabled:opacity-50"
                    >
                      {deleteListingMutation.isPending
                        ? "Deleting..."
                        : "🗑️ Delete Listing"}
                    </button>
                  </div>
                </div>
              ) : /* BUYER CONTROLS */
              alreadyRequested ? (
                <div className="space-y-4">
                  {isRequestApproved ? (
                    <>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-3.5 rounded-2xl text-center flex items-center justify-center gap-1.5">
                        <span>🎉</span>
                        <span>Your buy request was approved by the seller!</span>
                      </div>
                      <button
                        onClick={() => startChatMutation.mutate()}
                        disabled={startChatMutation.isPending}
                        className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3.5 rounded-2xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-xs shadow-2xl "
                      >
                        <span>💬 Negotiate / Chat with Seller</span>
                      </button>
                    </>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-4 py-3.5 rounded-2xl text-center flex items-center justify-center gap-1.5 animate-pulse">
                      <span>⏳</span>
                      <span>Your request is pending seller approval. Chat will unlock once approved.</span>
                    </div>
                  )}
                </div>
              ) : data.status !== "available" ? (
                <div className="bg-slate-100 text-slate-500 text-xs font-bold px-4 py-3.5 rounded-2xl text-center">
                  🔒 This listing is currently {data.status}.
                </div>
              ) : (
                /* REQUEST TO BUY */
                <div className="space-y-4">
                  <div className="space-y-3">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write a custom offer message to the seller (optional)..."
                      rows={3}
                      className="w-full border border-[#30363d] rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] bg-slate-50/50 hover:bg-slate-50 transition resize-none leading-relaxed"
                    />
                    <button
                      onClick={() => {
                        if (!user) {
                          toast("Please login to request to buy", { icon: "🔒" });
                          navigate("/login");
                          return;
                        }
                        sendRequestMutation.mutate();
                      }}
                      disabled={sendRequestMutation.isPending}
                      className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3.5 rounded-2xl transition duration-200 disabled:opacity-50 shadow-2xl  hover:shadow-indigo-500/20 text-xs uppercase tracking-wider"
                    >
                      {sendRequestMutation.isPending
                        ? "Sending Request..."
                        : "🛒 Request to Buy"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ADMINISTRATOR / MODERATION BYPASS CONTROLS */}
            {user && ["admin", "moderator"].includes(user.role) && (
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 space-y-3.5 shadow-2xl ">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <h3 className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
                    Administrative Moderation View
                  </h3>
                </div>
                <p className="text-slate-650 text-xs leading-relaxed">
                  As a moderator or system admin, you have strict bypass access.
                  You can forcefully delete this listing or suspend/block this seller's account.
                </p>
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "AUDIT ACTION: Are you sure you want to forcefully delete this listing? This action will write to audit logs.",
                        )
                      ) {
                        deleteListingMutation.mutate();
                      }
                    }}
                    disabled={deleteListingMutation.isPending}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl text-xs transition duration-200 shadow-xl disabled:opacity-50"
                  >
                    {deleteListingMutation.isPending
                      ? "Moderating..."
                      : "🗑️ Force Delete Listing"}
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `AUDIT ACTION: Are you sure you want to ${
                            data.seller?.isBlocked ? "UNBLOCK" : "BLOCK"
                          } seller "${data.seller?.name}"?`,
                        )
                      ) {
                        toggleBlockSellerMutation.mutate();
                      }
                    }}
                    disabled={toggleBlockSellerMutation.isPending}
                    className={`w-full font-bold py-3.5 rounded-2xl text-xs transition duration-200 shadow-xl disabled:opacity-50 ${
                      data.seller?.isBlocked
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }`}
                  >
                    {toggleBlockSellerMutation.isPending
                      ? "Processing..."
                      : data.seller?.isBlocked
                      ? "🔓 Reinstate Seller Account"
                      : "🚫 Suspend Seller Account"}
                  </button>
                </div>
              </div>
            )}

            {!isSeller && (
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    if (!user) {
                      toast("Please login to report this listing", { icon: "🔒" });
                      navigate("/login");
                      return;
                    }
                    setIsReportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-500 transition duration-150"
                >
                  <span>⚠️</span>
                  <span>Report this Listing</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Grid */}
        {similarListings && similarListings.length > 0 && (
          <div className="mt-16 border-t border-slate-100 pt-10">
            <h2 className="text-xl font-black text-slate-100 mb-6 tracking-tight flex items-center gap-2">
              <span>🏷️</span> Similar Items in {data.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {similarListings.map((listing) => (
                <div
                  key={listing._id}
                  onClick={() => {
                    navigate(`/listings/${listing._id}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl shadow-lg hover:shadow-2xl transition duration-200 cursor-pointer flex flex-col h-full group"
                >
                  {/* Image Viewport */}
                  <div className="aspect-video w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 bg-[#161b22]/90 border border-[#30363d] text-[#c9d1d9] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                      {listing.condition}
                    </span>
                  </div>

                  {/* Content details */}
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                       <h3 className="font-extrabold text-slate-200 text-sm truncate leading-snug group-hover:text-[#58a6ff] transition">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {listing.category}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4 mb-1">
                      <span className="text-base font-black text-[#58a6ff]">
                        ₹{listing.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        View details →
                      </span>
                    </div>
                    {listing.createdAt && (
                      <div className="text-[9px] font-bold text-gray-500">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN IMAGE CAROUSEL OVERLAY MODAL */}
      {isFullscreenModalOpen && data.images && data.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between p-6 select-none animate-fadeIn">
          {/* Close Header */}
          <div className="flex items-center justify-between text-white w-full">
            <span className="text-sm font-bold font-mono tracking-wider">
              {activeImageIndex + 1} / {data.images.length}
            </span>
            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/10 hover:bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/20 transition flex items-center justify-center text-xl font-bold font-sans"
              title="Close modal (Esc)"
            >
              ×
            </button>
          </div>

          {/* Active Viewport and side arrows */}
          <div className="flex-1 flex items-center justify-between gap-6 max-h-[80vh]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(
                  (prev) =>
                    (prev - 1 + data.images.length) % data.images.length,
                );
              }}
              className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/5 hover:bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/15 transition flex items-center justify-center text-white text-lg font-bold"
            >
              ◀
            </button>

            <div className="flex-1 h-full flex items-center justify-center">
              <img
                src={data.images[activeImageIndex]}
                alt={`Zoomed ${activeImageIndex}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev + 1) % data.images.length);
              }}
              className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/5 hover:bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20/15 transition flex items-center justify-center text-white text-lg font-bold"
            >
              ▶
            </button>
          </div>

          {/* Thumbnails row at bottom */}
          <div className="flex gap-2 overflow-x-auto justify-center pb-2">
            {data.images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  i === activeImageIndex
                    ? "border-indigo-500 scale-95"
                    : "border-transparent opacity-60"
                }`}
              >
                <img
                  src={src}
                  alt={`Modal Thumbnail ${i}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SELLER EDIT LISTING MODAL DIALOG */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-100">
                Edit Product Details
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-[#8b949e] text-2xl font-bold font-sans"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateListingMutation.mutate(editForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Condition
                  </label>
                  <select
                    required
                    value={editForm.condition}
                    onChange={(e) =>
                      setEditForm({ ...editForm, condition: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] cursor-pointer"
                  >
                    <option value="new">Brand New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  required
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] cursor-pointer"
                >
                  <option value="">Select a category</option>
                  {LISTING_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateListingMutation.isPending}
                  className="w-1/2 bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-xl  hover:shadow-indigo-500/20 disabled:opacity-50"
                >
                  {updateListingMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT LISTING MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h2 className="text-lg font-black text-slate-100">
                  Report Listing
                </h2>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-gray-400 hover:text-[#8b949e] text-2xl font-bold font-sans"
              >
                ×
              </button>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Is this item fraudulent, miscategorized, or violating college
              guidelines? Please describe the issue to alert the NITT
              administration team.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                reportMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description of violation
                </label>
                <textarea
                  required
                  rows={4}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide details about why this listing should be reviewed..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20 focus:border-[#58a6ff] resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    reportMutation.isPending || !reportDescription.trim()
                  }
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-xl  hover:shadow-rose-500/20 disabled:opacity-50"
                >
                  {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Photo Fullscreen View Modal */}
      {selectedAvatar && (
        <div
          onClick={() => setSelectedAvatar(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <img
            src={selectedAvatar}
            alt="Profile Preview"
            className="max-w-[85vw] max-h-[85vh] sm:max-w-md sm:max-h-md object-contain rounded-2xl border border-[#30363d] shadow-2xl animate-scaleUp"
          />
        </div>
      )}
    </div>
  );
}
