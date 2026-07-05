import { Link } from "react-router-dom";
import { LISTING_CATEGORIES } from "../../utils/constants";

export default function Footer() {
  return (
    <footer className="border-t border-[#333333] bg-[#121212] pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Logo & About */}
          <div className="lg:col-span-2 space-y-6">
            <Link
              to="/"
              className="text-2xl font-extrabold text-white flex items-center gap-2 w-fit"
            >
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover shadow-sm"
              />
              <span className="tracking-tight">CampusThrift</span>
              <span className="bg-[#1DB954]/20 text-[#1DB954] text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full ml-2">v1.2.5</span>
            </Link>
            <p className="text-[15px] leading-relaxed text-[#8b949e] max-w-sm">
              The premier marketplace for college students to securely buy, sell, and trade books, electronics, pre-loved goods, and old products right on campus.
            </p>

          </div>

          {/* Quick Links */}
          <div className="space-y-4 lg:col-span-1">
            <h4 className="text-sm font-extrabold text-white tracking-widest uppercase">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Home</Link></li>
              <li><Link to="/marketplace" className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Marketplace</Link></li>
              <li><Link to="/create-listing" className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Sell Item</Link></li>
              <li><Link to="/feedback" className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Feedback</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4 lg:col-span-1">
            <h4 className="text-sm font-extrabold text-white tracking-widest uppercase">
              Categories
            </h4>
            <ul className="space-y-2.5">
              {LISTING_CATEGORIES.slice(0, 4).map(cat => (
                <li key={cat}>
                  <Link to={`/marketplace?category=${encodeURIComponent(cat)}`} className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">
                    {cat}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/marketplace" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">
                  View All &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4 lg:col-span-1">
            <h4 className="text-sm font-extrabold text-white tracking-widest uppercase">
              Support
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/privacy-policy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Privacy Policy</Link></li>
              <li><Link to="/terms" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Terms & Conditions</Link></li>
              <li><Link to="/guidelines" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Community Guidelines</Link></li>
              <li><Link to="/support" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/70 hover:text-[#1DB954] text-[15px] font-medium transition">Help & Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#333333] flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-white/50 text-sm font-medium">
            &copy; {new Date().getFullYear()} CampusThrift. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
