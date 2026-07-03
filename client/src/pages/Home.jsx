import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import ListingCard from "../components/features/ListingCard";
import Navbar from "../components/layout/Navbar";
import { LISTING_CATEGORIES } from "../utils/constants";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [recentlyViewed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recently-viewed") || "[]");
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const recentlyViewedIds = recentlyViewed.map((item) => item._id).join(",");

  const { data: activeRecentlyViewed = [] } = useQuery({
    queryKey: ["active-recently-viewed", recentlyViewedIds],
    queryFn: async () => {
      if (!recentlyViewedIds) return [];
      const res = await api.get(`/listings?ids=${recentlyViewedIds}`);
      return res.data.data.listings;
    },
    enabled: recentlyViewed.length > 0,
  });

  const filteredRecentlyViewed = activeRecentlyViewed.filter(
    (item) => !category || item.category === category,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", search, category, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (sort) params.append("sort", sort);
      params.append("page", page);
      const res = await api.get(`/listings?${params.toString()}`);
      return res.data.data;
    },
    keepPreviousData: true,
  });

  const { data: trendingData } = useQuery({
    queryKey: ["trending-listings"],
    queryFn: async () => {
      const res = await api.get("/listings?limit=8");
      return res.data.data.listings
        .filter((l) => l.status === "available")
        .slice(0, 4);
    },
  });

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] rounded-xl shadow-2xl  p-4 mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-[200px] border border-[#30363d] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="border border-[#30363d] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            <option value="">All Categories</option>
            {LISTING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="border border-[#30363d] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            <option value="">Latest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Trending Deals Section */}
        {trendingData && trendingData.length > 0 && !search && !category && !sort && (
          <div className="mb-10 bg-gradient-to-br from-indigo-50/30 to-purple-50/10 border border-indigo-100/30 rounded-3xl p-6 shadow-2xl ">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Trending Now
              </h2>
              <span className="text-[10px] font-black text-[#58a6ff] bg-[#388bfd]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Popular NITT Deals
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {trendingData.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Row */}
        {filteredRecentlyViewed && filteredRecentlyViewed.length > 0 && !sort && !search && (
          <div className="mb-10 bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] border border-slate-100 rounded-3xl p-6 shadow-2xl ">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-4 tracking-tight">
              Recently Viewed {category && `in ${category}`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {filteredRecentlyViewed.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        )}

        {/* Main Feed Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {search || category ? "Search Results" : "Explore Marketplace"}
          </h2>
          {data?.pagination && (
            <span className="text-xs text-slate-400 font-medium">
              Showing {data.listings.length} of {data.pagination.total} items
            </span>
          )}
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            Loading listings...
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-400">
            Failed to load listings
          </div>
        ) : data?.listings?.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No listings found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.listings?.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {data?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: data.pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      page === i + 1
                        ? "bg-[#238636] text-white"
                        : "bg-[#161b22]/5 backdrop-blur-lg border border-[#30363d] text-[#8b949e] hover:bg-[#388bfd]/10 border border-[#30363d]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
