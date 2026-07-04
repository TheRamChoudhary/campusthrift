import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import ListingCard from "../components/features/ListingCard";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import bgImage from "../assets/background_image.png";

export default function Home() {
  const navigate = useNavigate();
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

  const filteredRecentlyViewed = activeRecentlyViewed;



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
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#1DB954]/30 selection:text-white relative">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      </div>
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Hero Banner Section */}
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-[2rem] overflow-hidden mb-20 shadow-2xl py-16 px-8 sm:px-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl z-10">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
                Welcome to CampusThrift
              </h1>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1DB954] leading-tight mb-6 tracking-tight">
                Buy & Sell second products on Campus
              </h2>
              <p className="text-lg text-white/70 font-medium mb-8 leading-relaxed">
                Find affordable books, electronics, furniture, bicycles and more from students around you. Safe, fast, and eco-friendly.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/marketplace"
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-black hover:scale-105 active:scale-95 font-bold px-8 py-4 rounded-full transition-all duration-200 text-[15px]"
                >
                  Browse Marketplace
                </Link>
                <Link
                  to="/create-listing"
                  className="bg-transparent border-2 border-white/20 hover:border-white/50 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 duration-200 text-[15px]"
                >
                  Sell Item
                </Link>
              </div>
            </div>
            <div className="hidden lg:block w-96 h-80 relative z-10">
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2940&auto=format&fit=crop" alt="Students on campus" className="w-full h-full object-cover rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white/10" />
            </div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1DB954]/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          </div>

        {/* Popular Categories */}
        <div className="mb-24">
          <h2 className="text-2xl font-extrabold text-white mb-8 tracking-tight">Popular Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { name: "Books", icon: "📚", q: "Books & Notes" },
              { name: "Electronics", icon: "💻", q: "Electronics" },
              { name: "Furniture", icon: "🪑", q: "Furniture" },
              { name: "Fashion", icon: "👕", q: "Clothing" },
              { name: "Sports", icon: "⚽", q: "Sports" },
              { name: "Stationery", icon: "✏️", q: "Stationery" },
              { name: "Cycles", icon: "🚲", q: "Cycles & Bicycles" },
              { name: "Others", icon: "📦", q: "Other" }
            ].map(cat => (
              <button
                key={cat.name}
                onClick={() => navigate('/marketplace?category=' + encodeURIComponent(cat.q))}
                className="w-full aspect-square bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-[#282828] hover:border-[#1DB954]/50 transition group"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-[13px] font-bold text-white/80 group-hover:text-[#1DB954] transition">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trending Deals Section */}
        {trendingData && trendingData.length > 0 && (
          <div className="mb-10 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-6 shadow-2xl ">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Trending Now
              </h2>
              <span className="text-[10px] font-black text-[#1DB954] bg-[#1DB954]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
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
        {filteredRecentlyViewed && filteredRecentlyViewed.length > 0 && (
          <div className="mb-10 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-6 shadow-2xl ">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-4 tracking-tight">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {filteredRecentlyViewed.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        )}



        {/* Features / Why Choose */}
        <div className="mt-32 mb-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">Why Choose CampusThrift?</h2>
            <p className="text-lg text-white/50">The smartest way to buy and sell on your college campus.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 p-8 rounded-[2rem] hover:border-[#1DB954]/50 transition group">
              <div className="w-16 h-16 bg-[#1DB954]/10 text-[#1DB954] rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Student Marketplace</h3>
              <p className="text-white/60 leading-relaxed">Only verified students from your campus can buy or sell. Enjoy peace of mind knowing who you're dealing with.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 p-8 rounded-[2rem] hover:border-[#1DB954]/50 transition group">
              <div className="w-16 h-16 bg-[#1DB954]/10 text-[#1DB954] rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Affordable Prices</h3>
              <p className="text-white/60 leading-relaxed">Find amazing deals on textbooks, electronics, and dorm essentials. Save money while helping fellow students.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 p-8 rounded-[2rem] hover:border-[#1DB954]/50 transition group">
              <div className="w-16 h-16 bg-[#1DB954]/10 text-[#1DB954] rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Sustainable Campus</h3>
              <p className="text-white/60 leading-relaxed">Reduce waste and promote a circular economy by giving perfectly good items a second life on campus.</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white text-center tracking-tight mb-16">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-between relative">
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-[#333333] to-transparent -translate-y-1/2 z-0"></div>
            
            <div className="flex flex-col items-center text-center relative z-10 flex-1 px-4 mb-10 md:mb-0">
              <div className="w-16 h-16 bg-[#121212] border-2 border-[#1DB954] text-[#1DB954] rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(29,185,84,0.2)]">1</div>
              <h3 className="text-lg font-bold text-white mb-2">Upload Product</h3>
              <p className="text-sm text-white/60">Snap a photo and set your price in seconds.</p>
            </div>
            <div className="flex flex-col items-center text-center relative z-10 flex-1 px-4 mb-10 md:mb-0">
              <div className="w-16 h-16 bg-[#121212] border-2 border-[#1DB954] text-[#1DB954] rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(29,185,84,0.2)]">2</div>
              <h3 className="text-lg font-bold text-white mb-2">Find Buyers</h3>
              <p className="text-sm text-white/60">Students on your campus discover your item.</p>
            </div>
            <div className="flex flex-col items-center text-center relative z-10 flex-1 px-4 mb-10 md:mb-0">
              <div className="w-16 h-16 bg-[#121212] border-2 border-[#1DB954] text-[#1DB954] rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(29,185,84,0.2)]">3</div>
              <h3 className="text-lg font-bold text-white mb-2">Chat Securely</h3>
              <p className="text-sm text-white/60">Negotiate and arrange a meetup via in-app chat.</p>
            </div>
            <div className="flex flex-col items-center text-center relative z-10 flex-1 px-4">
              <div className="w-16 h-16 bg-[#121212] border-2 border-[#1DB954] text-[#1DB954] rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(29,185,84,0.2)]">4</div>
              <h3 className="text-lg font-bold text-white mb-2">Meet on Campus</h3>
              <p className="text-sm text-white/60">Exchange the item and get paid safely.</p>
            </div>
          </div>
        </div>


      </main>

      <Footer />
      </div>
    </div>
  );
}
