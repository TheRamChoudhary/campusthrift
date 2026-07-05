import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";
import bgImage from "../assets/background_image.png";

const statusColors = {
  available: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  reserved: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  sold: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

const conditionLabels = {
  new: "New",
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
};

export default function MyListings() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const res = await api.get("/listings/my");
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/listings/${id}`),
    onSuccess: () => {
      toast.success("Listing deleted");
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete listing");
      setDeletingId(null);
    },
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen relative text-white selection:bg-[#1DB954]/30">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#c9d1d9]">My Listings</h1>
          <Link
            to="/create-listing"
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            + New Listing
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">
            Loading your listings...
          </div>
        ) : !listings?.length ? (
          <div className="text-center py-16">
            <p className="flex justify-center mb-4 text-slate-600">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </p>
            <p className="text-[#8b949e] font-medium text-lg">
              No listings yet
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first listing to start selling
            </p>
            <Link
              to="/create-listing"
              className="mt-4 inline-block bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing._id}
                onClick={() => window.location.assign(`/listings/${listing._id}`)}
                className="bg-white/5 backdrop-blur-xl hover:border-white/20 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:bg-white/10"
              >
                {/* Thumbnail */}
                <div className="w-full h-48 bg-slate-900 border-b border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {listing.images?.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-600">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${statusColors[listing.status]}`}
                    >
                      {listing.status}
                    </span>
                    <p className="text-[#58a6ff] font-black text-lg">
                      ₹{listing.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  
                  <Link
                    to={`/listings/${listing._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-[#c9d1d9] hover:text-white transition text-lg truncate block mb-3 relative z-10"
                  >
                    {listing.title}
                  </Link>

                  <div className="flex gap-2 flex-wrap mb-4">
                    <span className="bg-[#388bfd]/10 border border-indigo-100/10 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                      {listing.category}
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-full font-semibold">
                      {conditionLabels[listing.condition]}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/listings/${listing._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#58a6ff] hover:text-white font-bold transition flex items-center gap-1 relative z-10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        View
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(listing._id, listing.title); }}
                        disabled={deletingId === listing._id}
                        className="text-xs text-rose-500 hover:text-rose-400 font-bold transition disabled:opacity-50 flex items-center gap-1 relative z-10"
                      >
                        {deletingId === listing._id ? (
                          "Deleting..."
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
