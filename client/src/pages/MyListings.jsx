import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axiosInstance";
import Navbar from "../components/layout/Navbar";
import bgImage from "../assets/background_image.png";

const statusColors = {
  available: "bg-green-100 text-green-700",
  reserved: "bg-yellow-100 text-yellow-700",
  sold: "bg-red-100 text-red-700",
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
        <div className="absolute inset-0 bg-[#121212]/15 backdrop-blur-md"></div>
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#c9d1d9]">My Listings</h1>
          <Link
            to="/create-listing"
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
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
            <p className="text-5xl mb-4">📦</p>
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
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing._id}
                className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-xl border border-[#30363d] shadow-2xl  overflow-hidden flex"
              >
                {/* Thumbnail */}
                <div className="w-24 h-24 sm:w-32 sm:h-auto bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] flex-shrink-0 flex items-center justify-center">
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

                {/* Content */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/listings/${listing._id}`}
                        className="font-semibold text-[#c9d1d9] hover:text-[#58a6ff] transition text-sm sm:text-base truncate block"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-[#58a6ff] font-bold mt-0.5">
                        ₹{listing.price}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[listing.status]}`}
                    >
                      {listing.status.charAt(0).toUpperCase() +
                        listing.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="bg-[#21262d]/50 backdrop-blur-sm border border-[#30363d] text-[#8b949e] text-xs px-2 py-0.5 rounded-full">
                      {listing.category}
                    </span>
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {conditionLabels[listing.condition]}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Listed {new Date(listing.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center gap-2 p-4 border-l border-[#30363d] flex-shrink-0">
                  <Link
                    to={`/listings/${listing._id}`}
                    className="text-xs text-center text-[#58a6ff] hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg hover:bg-[#388bfd]/10 transition"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(listing._id, listing.title)}
                    disabled={deletingId === listing._id}
                    className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {deletingId === listing._id ? "Deleting..." : "Delete"}
                  </button>
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
