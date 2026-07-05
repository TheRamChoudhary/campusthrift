import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import ListingCard from "../components/features/ListingCard";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { LISTING_CATEGORIES } from "../utils/constants";

const SORT_OPTIONS = [
  { value: "", label: "Newest First" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "oldest", label: "Oldest First" },
];

const CONDITION_OPTIONS = [
  { value: "", label: "All Conditions" },
  { value: "new", label: "Brand New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden animate-pulse">
          <div className="h-52 bg-white/5" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-white/5 rounded-full w-3/4" />
            <div className="h-3 bg-white/5 rounded-full w-1/2" />
            <div className="h-6 bg-white/5 rounded-full w-1/3 mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Marketplace() {
  const location = useLocation();
  const initialCategory = new URLSearchParams(location.search).get("category") || "";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync category from URL param (e.g. from Home page quick-links)
  useEffect(() => {
    const cat = new URLSearchParams(location.search).get("category");
    if (cat && cat !== category) {
      setCategory(cat);
      setPage(1);
    }
  }, [location.search]);

  // Reset to page 1 whenever any filter changes
  useEffect(() => { setPage(1); }, [debouncedSearch, category, condition, sort]);

  // ─── Main query ─────────────────────────────────────────────────
  // When SEARCH is active, category acts as a refine-within-search filter.
  // When only category is set (no search), it's a category browse.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", debouncedSearch, category, condition, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (category) params.append("category", category);
      if (condition) params.append("condition", condition);
      if (sort) params.append("sort", sort);
      params.append("page", page);
      const res = await api.get(`/listings?${params.toString()}`);
      return res.data.data;
    },
    placeholderData: (prev) => prev,
  });

  // ─── "You might also like" fallback query ─────────────────────
  // Fires only when: search is active AND category is set AND main results = 0
  // Shows results for search WITHOUT the category restriction
  const noResultsInCategory =
    !isLoading && debouncedSearch && category && data?.listings?.length === 0;

  const { data: fallbackData, isLoading: fallbackLoading } = useQuery({
    queryKey: ["listings-fallback", debouncedSearch, condition, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("search", debouncedSearch);
      if (condition) params.append("condition", condition);
      if (sort) params.append("sort", sort);
      params.append("limit", "8");
      const res = await api.get(`/listings?${params.toString()}`);
      return res.data.data;
    },
    enabled: !!noResultsInCategory,
  });

  // ─── "Recommendations" query ──────────────────────────────────
  // Shows when main results exist AND category is set — "also in other categories"
  const showRecommendations =
    !isLoading &&
    !debouncedSearch &&
    category &&
    (data?.listings?.length ?? 0) > 0;

  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ["listings-recs", category, condition],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Exclude current category to get OTHER products
      if (condition) params.append("condition", condition);
      params.append("limit", "8");
      const res = await api.get(`/listings?${params.toString()}`);
      // filter client-side to exclude same category
      const all = res.data.data.listings || [];
      return all.filter((l) => l.category !== category).slice(0, 8);
    },
    enabled: !!showRecommendations,
  });

  const clearFilters = useCallback(() => {
    setSearch(""); setDebouncedSearch("");
    setCategory(""); setCondition("");
    setSort(""); setPage(1);
  }, []);

  const activeFilterCount = [category, condition, sort].filter(Boolean).length;
  const hasFilters = !!(debouncedSearch || category || condition || sort);

  const scrollToResults = () => {
    document.getElementById("marketplace-results")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#1DB954]/30 selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* ─── Hero Bar ─── */}
        <div className="bg-gradient-to-b from-[#1DB954]/6 to-transparent border-b border-white/5 py-10 px-4">
          <div className="max-w-[1400px] mx-auto">
            <p className="text-[#1DB954] text-xs font-bold uppercase tracking-widest mb-2">NIT Trichy Campus</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">Explore Marketplace</h1>
            <p className="text-white/50 text-base">Browse hundreds of listings from verified NITT students.</p>
          </div>
        </div>

        <div className="max-w-[1400px] w-full mx-auto px-4 py-8">

          {/* ══════════════════════════════════════════════════
              SEARCH & FILTER PANEL
          ══════════════════════════════════════════════════ */}
          <div className="bg-white/3 border border-white/8 rounded-3xl p-5 mb-8 space-y-4">
            {/* Row 1: Search Bar */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 px-1 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Search
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search any product — cycles, books, laptop, chair..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#1DB954]/60 rounded-2xl pl-12 pr-12 py-4 text-[15px] font-medium text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#1DB954]/15 transition"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* Smart hint when search conflicts with category */}
              {debouncedSearch && category && (
                <p className="text-[11px] text-amber-400/80 mt-2 px-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Searching <strong className="text-white">"{debouncedSearch}"</strong> within{" "}
                  <strong className="text-[#1DB954]">{category}</strong>.
                  {data?.listings?.length === 0 && !isLoading && (
                    <button
                      onClick={() => { setCategory(""); setPage(1); }}
                      className="underline text-amber-400 hover:text-white ml-1"
                    >
                      Remove category filter →
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Row 2: Three filter dropdowns — always visible */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 px-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  Category
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className={`w-full appearance-none bg-[#111] border rounded-xl px-4 pr-10 py-3 text-[14px] font-medium focus:outline-none transition cursor-pointer ${
                      category
                        ? "border-[#1DB954]/50 text-[#1DB954] focus:border-[#1DB954]"
                        : "border-white/10 text-white/60 focus:border-[#1DB954]/50"
                    }`}
                  >
                    <option value="">All Categories</option>
                    {LISTING_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-xs">▼</span>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 px-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Condition
                </label>
                <div className="relative">
                  <select
                    value={condition}
                    onChange={(e) => { setCondition(e.target.value); setPage(1); }}
                    className={`w-full appearance-none bg-[#111] border rounded-xl px-4 pr-10 py-3 text-[14px] font-medium focus:outline-none transition cursor-pointer ${
                      condition
                        ? "border-[#1DB954]/50 text-[#1DB954] focus:border-[#1DB954]"
                        : "border-white/10 text-white/60 focus:border-[#1DB954]/50"
                    }`}
                  >
                    {CONDITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-xs">▼</span>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2 px-1 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className={`w-full appearance-none bg-[#111] border rounded-xl px-4 pr-10 py-3 text-[14px] font-medium focus:outline-none transition cursor-pointer ${
                      sort
                        ? "border-[#1DB954]/50 text-[#1DB954] focus:border-[#1DB954]"
                        : "border-white/10 text-white/60 focus:border-[#1DB954]/50"
                    }`}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none text-xs">▼</span>
                </div>
              </div>
            </div>

            {/* Active filter chips + clear */}
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-white/25 font-semibold uppercase tracking-wider">Active:</span>
                {debouncedSearch && (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-white/5 border border-white/10 text-white/70 px-3 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    "{debouncedSearch}"
                    <button onClick={() => { setSearch(""); setDebouncedSearch(""); }} className="hover:text-white transition ml-0.5">✕</button>
                  </span>
                )}
                {category && (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] px-3 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    {category}
                    <button onClick={() => { setCategory(""); setPage(1); }} className="hover:text-white transition ml-0.5">✕</button>
                  </span>
                )}
                {condition && (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] px-3 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    {CONDITION_OPTIONS.find(c => c.value === condition)?.label}
                    <button onClick={() => { setCondition(""); setPage(1); }} className="hover:text-white transition ml-0.5">✕</button>
                  </span>
                )}
                {sort && (
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] px-3 py-1 rounded-full">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                    {SORT_OPTIONS.find(s => s.value === sort)?.label}
                    <button onClick={() => { setSort(""); setPage(1); }} className="hover:text-white transition ml-0.5">✕</button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="ml-auto text-[11px] font-bold text-rose-400/80 hover:text-rose-300 transition flex items-center gap-1"
                >
                  ✕ Clear all
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              RESULTS SECTION
          ══════════════════════════════════════════════════ */}
          <div id="marketplace-results" className="scroll-mt-24">

            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {debouncedSearch && category
                    ? `"${debouncedSearch}" in ${category}`
                    : debouncedSearch
                    ? `Results for "${debouncedSearch}"`
                    : category
                    ? category
                    : "All Listings"}
                </h2>
                {!isLoading && data?.pagination && (
                  <p className="text-[12px] text-white/40 mt-0.5">
                    {data.pagination.total} item{data.pagination.total !== 1 ? "s" : ""} found
                    {data.pagination.pages > 1 && ` · Page ${page} of ${data.pagination.pages}`}
                  </p>
                )}
              </div>
            </div>

            {/* ── Main content ── */}
            {isLoading ? (
              <SkeletonGrid />
            ) : isError ? (
              <div className="text-center py-24">
                <span className="text-slate-600 flex justify-center mb-4">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </span>
                <p className="text-white/50 font-semibold">Failed to load listings</p>
                <p className="text-white/30 text-sm mt-1">Please try again later.</p>
              </div>
            ) : noResultsInCategory ? (
              /* ── SEARCH + CATEGORY conflict: no results in this category ── */
              <div>
                <div className="text-center py-12 bg-white/3 border border-white/8 rounded-3xl mb-10">
                  <span className="text-slate-500 flex justify-center mb-4">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  <p className="text-white/70 font-bold text-lg">
                    No "{debouncedSearch}" found in <span className="text-[#1DB954]">{category}</span>
                  </p>
                  <p className="text-white/30 text-sm mt-2 max-w-sm mx-auto">
                    This product may be listed under a different category.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center mt-5">
                    <button
                      onClick={() => { setCategory(""); setPage(1); }}
                      className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-6 py-2.5 rounded-full text-sm transition-all hover:scale-105"
                    >
                      Search across all categories
                    </button>
                    <button
                      onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(1); }}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 font-bold px-6 py-2.5 rounded-full text-sm transition"
                    >
                      Browse {category} only
                    </button>
                  </div>
                </div>

                {/* You might also like — search results ignoring category */}
                {(fallbackLoading || (fallbackData?.listings?.length ?? 0) > 0) && (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 h-px bg-white/5" />
                      <p className="text-sm font-bold text-white/50 flex items-center gap-2">
                        <span className="text-[#1DB954]">✦</span>
                        You might also like — "{debouncedSearch}" in other categories
                        <span className="text-[#1DB954]">✦</span>
                      </p>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    {fallbackLoading ? (
                      <SkeletonGrid count={4} />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {fallbackData?.listings?.filter(l => l.category !== category).slice(0, 8).map((listing) => (
                          <ListingCard key={listing._id} listing={listing} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : data?.listings?.length === 0 ? (
              /* ── GENUINE empty state ── */
              <div className="text-center py-24">
                <span className="text-slate-600 flex justify-center mb-4">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </span>
                <p className="text-white/60 font-bold text-lg">No listings found</p>
                <p className="text-white/30 text-sm mt-2 max-w-sm mx-auto">
                  Try broadening your search or removing some filters.
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-6 py-2.5 rounded-full text-sm transition-all hover:scale-105"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* ── Main Listings Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {data?.listings?.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>

                {/* ── Pagination ── */}
                {data?.pagination?.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                      onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToResults(); }}
                      disabled={page === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      ←
                    </button>

                    {Array.from({ length: data.pagination.pages }, (_, i) => {
                      const p = i + 1;
                      const near = Math.abs(p - page) <= 2 || p === 1 || p === data.pagination.pages;
                      if (!near) {
                        if (p === page - 3 || p === page + 3) return <span key={p} className="text-white/20">…</span>;
                        return null;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => { setPage(p); scrollToResults(); }}
                          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition ${
                            page === p
                              ? "bg-[#1DB954] text-black shadow-[0_0_20px_rgba(29,185,84,0.4)]"
                              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => { setPage((p) => Math.min(data.pagination.pages, p + 1)); scrollToResults(); }}
                      disabled={page === data.pagination.pages}
                      className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      →
                    </button>
                  </div>
                )}

                {/* ══ RECOMMENDATIONS — shown after category results ══ */}
                {showRecommendations && !recLoading && (recData?.length ?? 0) > 0 && (
                  <div className="mt-16">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex-1 h-px bg-white/5" />
                      <p className="text-sm font-bold text-white/50 flex items-center gap-2 whitespace-nowrap">
                        <span className="text-[#1DB954]">✦</span>
                        You might also like
                        <span className="text-[#1DB954]">✦</span>
                      </p>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                      {recData.map((listing) => (
                        <ListingCard key={listing._id} listing={listing} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
