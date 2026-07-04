import { Link } from "react-router-dom";

const conditionConfig = {
  new: { label: "Brand New", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  "like-new": { label: "Like New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  good: { label: "Good", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  fair: { label: "Fair", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

export default function ListingCard({ listing }) {
  const condition = conditionConfig[listing.condition] || {
    label: listing.condition,
    color: "bg-white/10 text-white/60 border-white/10",
  };

  return (
    <Link to={`/listings/${listing._id}`} className="group block h-full">
      <div className="relative bg-white/5 border border-white/10 group-hover:border-[#1DB954]/40 rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(29,185,84,0.10)] group-hover:-translate-y-1 flex flex-col h-full">

        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-[#1a1a1a] flex-shrink-0">
          {listing.images?.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-20">📦</span>
            </div>
          )}

          {/* Condition badge - overlay on image */}
          <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${condition.color}`}>
            {condition.label}
          </span>

          {/* Category badge */}
          <span className="absolute top-3 right-3 text-[10px] font-semibold text-white/70 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 max-w-[110px] truncate">
            {listing.category}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-white text-[15px] leading-snug line-clamp-2 group-hover:text-[#1DB954] transition-colors duration-200 mb-2">
            {listing.title}
          </h3>

          {/* Price */}
          <p className="text-2xl font-black text-[#1DB954] mt-auto mb-3 tracking-tight">
            ₹{listing.price.toLocaleString("en-IN")}
          </p>

          {/* Footer */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1DB954]/30 to-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center text-white text-[9px] uppercase font-black flex-shrink-0">
                {listing.seller?.name?.[0] || "?"}
              </div>
              <span className="text-[12px] text-white/50 font-medium truncate">
                {listing.seller?.name || "Unknown"}
              </span>
            </div>
            {listing.createdAt && (
              <span className="text-[11px] text-white/30 flex-shrink-0 font-mono">
                {new Date(listing.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </span>
            )}
          </div>
        </div>

        {/* Hover glow effect at the bottom */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#1DB954] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  );
}
