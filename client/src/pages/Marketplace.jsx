import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import ListingCard from "../components/features/ListingCard";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { LISTING_CATEGORIES } from "../utils/constants";

export default function Marketplace() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || "";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    if (cat && cat !== category) {
      setCategory(cat);
      setPage(1);
    }
  }, [location.search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", search, category, condition, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (condition) params.append("condition", condition);
      if (sort) params.append("sort", sort);
      params.append("page", page);
      const res = await api.get(`/listings?${params.toString()}`);
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#1DB954]/30 selection:text-white flex flex-col">
      <Navbar />

      <main className="max-w-[1400px] w-full mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-extrabold mb-6 tracking-tight">Explore Marketplace</h1>
        
        {/* Search and Filters */}
        <div className="bg-[#181818] border border-[#333333] rounded-3xl shadow-xl p-4 mb-8 flex flex-col md:flex-row gap-4 relative z-20">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search for books, electronics, furniture..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#121212] border border-[#333333] rounded-full pl-12 pr-4 py-3 text-[15px] font-medium text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954] transition"
            />
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="flex-1 md:w-36 bg-[#121212] border border-[#333333] rounded-full px-4 py-3 text-[14px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954] transition cursor-pointer appearance-none"
            >
              <option value="">Category</option>
              {LISTING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
              className="flex-1 md:w-32 bg-[#121212] border border-[#333333] rounded-full px-4 py-3 text-[14px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954] transition cursor-pointer appearance-none"
            >
              <option value="">Condition</option>
              <option value="new">Brand New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="flex-1 md:w-32 bg-[#121212] border border-[#333333] rounded-full px-4 py-3 text-[14px] font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954]/50 focus:border-[#1DB954] transition cursor-pointer appearance-none"
            >
              <option value="">Sort By</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div id="marketplace-results" className="flex items-center justify-between mb-8 scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Results
          </h2>
          {data?.pagination && (
            <span className="text-xs text-white/50 font-bold bg-[#181818] px-3 py-1 rounded-full border border-[#333333]">
              Showing {data.listings.length} of {data.pagination.total}
            </span>
          )}
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-white/40">
            Loading listings...
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-400">
            Failed to load listings
          </div>
        ) : data?.listings?.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            No listings found matching your search.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data?.listings?.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {data?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: data.pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => {
                      setPage(i + 1);
                      document.getElementById("marketplace-results").scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition shadow-sm ${
                      page === i + 1
                        ? "bg-[#1DB954] text-black"
                        : "bg-[#181818] text-white/60 hover:bg-[#282828] hover:text-white border border-[#333333]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
