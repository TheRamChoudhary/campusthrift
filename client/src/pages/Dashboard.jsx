import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";

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
      <div className="text-center py-12 bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl ">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-[#8b949e] font-medium">No buy requests sent yet</p>
        <p className="text-gray-400 text-xs mt-1">
          Found something you like? Send a request to the seller.
        </p>
        <Link
          to="/"
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
          className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl  p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-xl "
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
              <span>👤 Seller: {req.seller?.name}</span>
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
                    onClick={() => setSelectedRequestForReview(req)}
                    className="bg-[#388bfd]/10 hover:bg-[#388bfd]/20 text-[#58a6ff] border border-[#30363d] text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    ⭐ Rate Seller
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
                <span>⭐</span> Rate Seller: {selectedRequestForReview.seller?.name}
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
              <span className="block mt-2 text-[10px] text-amber-500 font-extrabold bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20 leading-relaxed">
                🔒 Confidentiality Guard: Your review is 100% anonymous. Individual scores and comments are never shown publicly or to the seller.
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
                    {reviewRating === 1 && "Poor 😠"}
                    {reviewRating === 2 && "Fair 😕"}
                    {reviewRating === 3 && "Average 🙂"}
                    {reviewRating === 4 && "Good 😊"}
                    {reviewRating === 5 && "Excellent! 😍"}
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
    onSuccess: () => {
      toast.success("Request approved!");
      queryClient.invalidateQueries({ queryKey: ["my-requests-seller"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to approve"),
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
      <div className="text-center py-12 bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl ">
        <p className="text-5xl mb-4">📭</p>
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
          className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl border border-[#30363d] shadow-2xl  p-5 transition hover:shadow-xl "
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
                onClick={() => approveMutation.mutate(req._id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl shadow-xl  transition disabled:opacity-50"
              >
                ✓ Approve Buy Request
              </button>
              <button
                onClick={() => rejectMutation.mutate(req._id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold py-2.5 rounded-xl border border-red-100 transition disabled:opacity-50"
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
      <div className="text-center py-12 bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl shadow-2xl ">
        <p className="text-5xl mb-4">❤️</p>
        <p className="text-[#8b949e] dark:text-slate-300 font-medium">
          Your Wishlist is empty
        </p>
        <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">
          Bookmark campus items you want to keep an eye on!
        </p>
        <Link
          to="/"
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
          className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl shadow-2xl  overflow-hidden flex flex-col justify-between transition hover:shadow-xl "
        >
          <div className="p-4 flex gap-3">
            <div className="w-20 h-20 bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] dark:bg-slate-950 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {listing.images?.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">📦</span>
              )}
            </div>
            <div className="min-w-0">
              <Link
                to={`/listings/${listing._id}`}
                className="font-bold text-[#c9d1d9] dark:text-slate-100 hover:text-[#58a6ff] dark:hover:text-indigo-400 transition text-sm sm:text-base truncate block"
              >
                {listing.title}
              </Link>
              <p className="text-[#58a6ff] dark:text-indigo-400 font-extrabold text-sm mt-1">
                ₹{listing.price?.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-gray-450 dark:text-slate-400 mt-1">
                Seller: {listing.seller?.name || "Anonymous"}
              </p>
            </div>
          </div>
          <div className="bg-transparent/50 dark:bg-slate-950/40 px-4 py-2 border-t border-[#30363d] dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-[#58a6ff] dark:text-indigo-400 font-semibold bg-[#388bfd]/10 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">
              {listing.category}
            </span>
            <button
              onClick={() => removeMutation.mutate(listing._id)}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs transition flex items-center gap-1"
            >
              💔 Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = ["buyer", "seller", "wishlist"].includes(tabParam) ? tabParam : "buyer";

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: "buyer", label: "🛒 My Requests" },
    { id: "seller", label: "📬 Incoming Requests" },
    { id: "wishlist", label: "❤️ Wishlist" },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-[#c9d1d9] dark:text-slate-100 mb-6 tracking-tight">
          Dashboard
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-2xl p-1.5 shadow-2xl  mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition ${
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
        </div>
      </div>


    </div>
  );
}
