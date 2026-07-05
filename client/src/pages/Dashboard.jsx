import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";
import useAuthStore from "../store/authStore";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};

function BuyerTab() {
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests-buyer"],
    queryFn: async () => {
      const res = await api.get("/requests/buyer");
      return res.data.data;
    },
  });

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequestForReview?.listing?._id) return;

    setSubmittingReview(true);
    try {
      await api.post("/reviews", {
        listingId: selectedRequestForReview.listing._id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Review submitted! Trust score updated.");
      setSelectedRequestForReview(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading)
    return (
      <div className="text-center py-12 text-gray-400">
        Loading your requests...
      </div>
    );
  if (!requests?.length)
    return (
      <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl border border-[#30363d] shadow-2xl ">
        <span className="text-slate-600 flex justify-center mb-4">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        </span>
        <p className="text-[#8b949e] font-medium">No buy requests sent yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Found something you like? Send a request to the seller.
        </p>
        <Link
          to="/marketplace"
          className="text-[#58a6ff] text-sm font-semibold mt-4 inline-block hover:underline"
        >
          Browse Listings →
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div
          key={req._id}
          onClick={() => navigate(`/listings/${req.listing?._id}`)}
          className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl border border-[#30363d] shadow-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-xl cursor-pointer hover:bg-white/10"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/listings/${req.listing?._id}`}
                className="font-bold text-[#c9d1d9] hover:text-[#58a6ff] transition text-sm sm:text-base truncate block"
              >
                {req.listing?.title || "Listing removed"}
              </Link>
            </div>
            <p className="text-[#58a6ff] font-extrabold text-base mt-1">
              ₹{req.listing?.price?.toLocaleString("en-IN")}
            </p>
            {req.message && (
              <p className="text-xs text-[#8b949e] mt-2 italic bg-transparent px-3 py-2 rounded-lg border border-[#30363d]">
                "{req.message}"
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 font-medium">
              <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Seller: {req.seller?.name}</span>
              <span>·</span>
              <span>{req.seller?.email}</span>
            </p>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#30363d]">
            <div className="flex flex-col items-start sm:items-end gap-1">
              {req.status === "approved" && req.paymentStatus === "paid" ? (
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Paid & Sold
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedRequestForReview(req); }}
                    className="bg-[#388bfd]/10 hover:bg-[#388bfd]/20 text-[#58a6ff] border border-[#30363d] text-[10px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 z-10 relative"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    Rate Seller
                  </button>
                </div>
              ) : (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${statusColors[req.status]}`}
                >
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              )}
              <span className="text-[10px] text-gray-400 font-medium">
                Sent: {new Date(req.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Rate Seller Modal */}
      {selectedRequestForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22]/90 border border-[#30363d] rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scaleUp text-[#c9d1d9]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-extrabold text-[#c9d1d9] flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                Rate Seller: {selectedRequestForReview.seller?.name}
              </h3>
              <button
                onClick={() => setSelectedRequestForReview(null)}
                className="text-gray-400 hover:text-white text-2xl font-bold font-sans"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#8b949e] mb-4 leading-relaxed">
              How was your experience buying <strong>{selectedRequestForReview.listing?.title}</strong>? Your rating directly updates the seller's trust score.
              <span className="mt-2 text-[10px] text-amber-500 font-extrabold bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20 leading-relaxed flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Confidentiality Guard: Your review is 100% anonymous. Individual scores and comments are never shown publicly or to the seller.
              </span>
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="text-2xl focus:outline-none transition-transform active:scale-95 bg-transparent"
                    >
                      <span
                        className={
                          star <= (hoverRating || reviewRating)
                            ? "text-amber-400"
                            : "text-gray-650"
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-[#8b949e] ml-3">
                    {reviewRating === 1 && "Poor"}
                    {reviewRating === 2 && "Fair"}
                    {reviewRating === 3 && "Average"}
                    {reviewRating === 4 && "Good"}
                    {reviewRating === 5 && "Excellent!"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Review Comment
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Share a short comment about this transaction..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  maxLength={500}
                  className="w-full border border-[#30363d] rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#0d1117] text-[#c9d1d9] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3 rounded-xl transition duration-200 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SellerTab() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests-seller"],
    queryFn: async () => {
      const res = await api.get("/requests/seller");
      return res.data.data;
    },
  });

  const approveMutation = useMutation({
    pointer: "approve",
    mutationFn: (id) => api.put(`/requests/${id}/approve`),
    onSuccess: (resData) => {
      toast.success("Request approved!");
      queryClient.invalidateQueries({ queryKey: ["my-requests-seller"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      
      const conversationId = resData?.data?.data?.conversationId;
      if (conversationId) {
        navigate(`/chat?conversationId=${conversationId}`);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to approve request");
    },
  });

  const rejectMutation = useMutation({
    pointer: "reject",
    mutationFn: (id) => api.put(`/requests/${id}/reject`),
    onSuccess: () => {
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["my-requests-seller"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to reject"),
  });

  if (isLoading)
    return (
      <div className="text-center py-12 text-gray-400">
        Loading incoming requests...
      </div>
    );
  if (!requests?.length)
    return (
      <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl border border-[#30363d] shadow-2xl ">
        <span className="text-slate-600 flex justify-center mb-4">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </span>
        <p className="text-[#8b949e] font-medium">No incoming requests yet</p>
        <p className="text-gray-400 text-xs mt-1">
          List your textbooks, electronics, and stationery to get buyers!
        </p>
        <Link
          to="/create-listing"
          className="text-[#58a6ff] text-sm font-semibold mt-4 inline-block hover:underline"
        >
          Create a listing →
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div
          key={req._id}
          onClick={() => navigate(`/listings/${req.listing?._id}`)}
          className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl border border-[#30363d] shadow-2xl p-5 transition hover:shadow-xl cursor-pointer hover:bg-white/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link
                to={`/listings/${req.listing?._id}`}
                className="font-bold text-[#c9d1d9] hover:text-[#58a6ff] transition text-sm sm:text-base truncate block"
              >
                {req.listing?.title || "Listing removed"}
              </Link>
              <p className="text-[#58a6ff] font-extrabold text-base mt-1">
                ₹{req.listing?.price?.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-[#8b949e] mt-2 font-medium bg-[#388bfd]/10/40 px-3 py-1.5 rounded-lg inline-block">
                Buyer:{" "}
                <span className="font-bold text-[#8b949e]">
                  {req.buyer?.name}
                </span>
                <span className="text-gray-400"> ({req.buyer?.email})</span>
              </p>
              {req.message && (
                <p className="text-xs text-[#8b949e] mt-3 italic bg-transparent px-3 py-2.5 rounded-xl border border-[#30363d]">
                  "{req.message}"
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {req.status === "approved" && req.paymentStatus === "paid" ? (
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Paid & Sold
                </span>
              ) : (
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${statusColors[req.status]}`}
                >
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              )}
              <span className="text-[10px] text-gray-400 font-medium">
                {new Date(req.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {req.status === "pending" && (
            <div className="flex gap-3 mt-4 pt-4 border-t border-[#30363d]">
              <button
                onClick={(e) => { e.stopPropagation(); approveMutation.mutate(req._id); }}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl shadow-xl transition disabled:opacity-50 z-10 relative"
              >
                ✓ Approve Buy Request
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(req._id); }}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold py-2.5 rounded-xl border border-red-100 transition disabled:opacity-50 z-10 relative"
              >
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


function WishlistTab() {
  const queryClient = useQueryClient();
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ["my-wishlist"],
    queryFn: async () => {
      const res = await api.get("/listings/my/wishlist");
      return res.data.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => api.post(`/listings/${id}/wishlist`),
    onSuccess: () => {
      toast.success("Removed from wishlist");
      queryClient.invalidateQueries({ queryKey: ["my-wishlist"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to remove"),
  });

  if (isLoading)
    return (
      <div className="text-center py-12 text-gray-400">
        Loading saved items...
      </div>
    );
  if (!wishlist?.length)
    return (
      <div className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl shadow-2xl ">
        <span className="text-slate-600 flex justify-center mb-4">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
        </span>
        <p className="text-[#8b949e] dark:text-slate-300 font-medium">
          Your Wishlist is empty
        </p>
        <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">
          Bookmark campus items you want to keep an eye on!
        </p>
        <Link
          to="/marketplace"
          className="text-[#58a6ff] dark:text-indigo-400 text-sm font-semibold mt-4 inline-block hover:underline"
        >
          Explore Marketplace →
        </Link>
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {wishlist.map((listing) => (
        <div
          key={listing._id}
          className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl shadow-2xl  overflow-hidden flex flex-col justify-between transition hover:shadow-xl hover:scale-[1.01] hover:border-slate-400/30"
        >
          <Link to={`/listings/${listing._id}`} className="p-4 flex gap-3 cursor-pointer select-none">
            <div className="w-20 h-20 bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] dark:bg-slate-950 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {listing.images?.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-[#c9d1d9] dark:text-slate-100 transition text-sm sm:text-base truncate">
                {listing.title}
              </h4>
              <p className="text-[#58a6ff] dark:text-indigo-400 font-extrabold text-sm mt-1">
                ₹{listing.price?.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-gray-450 dark:text-slate-400 mt-1">
                Seller: {listing.seller?.name || "Anonymous"}
              </p>
            </div>
          </Link>
          <div className="bg-transparent/50 dark:bg-slate-950/40 px-4 py-2 border-t border-[#30363d] dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-[#58a6ff] dark:text-indigo-400 font-semibold bg-[#388bfd]/10 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
              {listing.category}
            </span>
            <button
              onClick={() => removeMutation.mutate(listing._id)}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab() {
  const { user, updateUser } = useAuthStore();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  
  // Get user profile details
  const { data: profile, refetch } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.data;
    },
  });

  const [formData, setFormData] = useState({
    name: profile?.name || user?.name || "",
    bio: profile?.bio || "",
    department: profile?.department || "",
    branch: profile?.branch || "",
    hostel: profile?.hostel || "",
    phone: profile?.phone || "",
    avatar: profile?.avatar || user?.avatar || "",
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        department: profile.department || "",
        branch: profile.branch || "",
        hostel: profile.hostel || "",
        phone: profile.phone || "",
        avatar: profile.avatar || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image size must be less than 5MB");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("images", file);

    setUploadingAvatar(true);
    const loadingToastId = toast.loading("Uploading profile photo...");
    try {
      const res = await api.post("/listings/upload-images", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const avatarUrl = res.data.data.urls[0];
      setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
      toast.success("Profile photo uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload avatar image");
    } finally {
      toast.dismiss(loadingToastId);
      setUploadingAvatar(false);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedFields) => {
      const res = await api.put("/auth/profile", updatedFields);
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      toast.success("Profile updated successfully!");
      // Update global auth store state
      updateUser({
        ...user,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
      });
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-6 shadow-2xl space-y-6 text-[#c9d1d9]">
      <div className="flex items-center gap-4 border-b border-[#30363d] pb-4">
        <span className="text-slate-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        </span>
        <div>
          <h2 className="text-lg font-bold">Profile Settings</h2>
          <p className="text-xs text-[#8b949e]">Update your college identity and contact settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-transparent p-4 rounded-2xl border border-[#30363d]">
          <div className="relative">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="Avatar Preview"
                onClick={() => setSelectedAvatar(formData.avatar)}
                className="w-20 h-20 rounded-full object-cover border border-[#30363d] shadow-lg cursor-zoom-in hover:opacity-90 transition"
                title="View Full Size"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl uppercase border border-[#30363d]">
                {formData.name?.[0] || "?"}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-slate-900/70 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1 text-center sm:text-left">
            <p className="text-xs font-bold text-[#c9d1d9]">Profile Photo</p>
            <p className="text-[10px] text-gray-400">Supports JPEG, PNG, or WebP. Max size 5MB.</p>
            <label className="inline-block mt-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition">
              Upload New Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Display Name (Full Name)
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Rahul Sharma"
            className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#0d1117] text-[#c9d1d9]"
          />
        </div>

        {/* Bio Field */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Short Bio
          </label>
          <textarea
            name="bio"
            rows="2"
            value={formData.bio}
            onChange={handleChange}
            maxLength={200}
            placeholder="Introduce yourself (e.g., 'Looking to buy books, selling electronics')"
            className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#0d1117] text-[#c9d1d9] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department Field */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Department (Optional)
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Computer Science / Mechanical"
              className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#0d1117] text-[#c9d1d9]"
            />
          </div>

          {/* Branch Field */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Branch / Program (Optional)
            </label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              placeholder="e.g. B.Tech / M.Tech"
              className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#0d1117] text-[#c9d1d9]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hostel location Field */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Hostel / Location (Optional)
            </label>
            <input
              type="text"
              name="hostel"
              value={formData.hostel}
              onChange={handleChange}
              placeholder="e.g. Garnet A / Opal C"
              className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#0d1117] text-[#c9d1d9]"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full border border-[#30363d] rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#58a6ff] bg-[#0d1117] text-[#c9d1d9]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updateProfileMutation.isPending || uploadingAvatar}
          className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3 rounded-xl transition duration-200 text-xs uppercase tracking-wider disabled:opacity-50 shadow-xl"
        >
          {updateProfileMutation.isPending ? "Saving changes..." : "Save Profile Settings"}
        </button>
      </form>

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

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = ["buyer", "seller", "wishlist", "profile"].includes(tabParam) ? tabParam : "buyer";

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: "buyer", label: <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> My Requests</span> },
    { id: "seller", label: <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Incoming Requests</span> },
    { id: "wishlist", label: <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> Wishlist</span> },
    { id: "profile", label: <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Profile Settings</span> },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-[#c9d1d9] dark:text-slate-100 mb-6 tracking-tight">
          Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-1.5 shadow-2xl  mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-1 justify-center items-center py-3 px-2 text-xs sm:text-sm font-bold rounded-xl transition ${
                activeTab === tab.id
                  ? "bg-[#238636] text-white shadow-xl "
                  : "text-[#8b949e] hover:text-[#8b949e] dark:text-slate-400 dark:hover:text-slate-200 hover:bg-transparent dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === "buyer" && <BuyerTab />}
          {activeTab === "seller" && <SellerTab />}
          {activeTab === "wishlist" && <WishlistTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </div>
    </div>
  );
}
