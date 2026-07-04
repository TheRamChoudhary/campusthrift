import { Link } from "react-router-dom";

const conditionColors = {
  new: "bg-green-100 text-green-700",
  "like-new": "bg-blue-100 text-blue-700",
  good: "bg-yellow-100 text-yellow-700",
  fair: "bg-orange-100 text-orange-700",
};

export default function ListingCard({ listing }) {
  return (
    <Link to={`/listings/${listing._id}`} className="group block">
      <div className="bg-[#161b22]/85 border border-[#30363d] rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-[#22c55e]/50 transition-all duration-300 overflow-hidden relative flex flex-col h-full">
        
        {/* Wishlist Button (absolute top right) */}
        <button 
          onClick={(e) => { e.preventDefault(); /* Wishlist functionality to be added */ }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-rose-500 hover:text-white transition-colors z-10 opacity-0 group-hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Image */}
        <div className="h-56 bg-[#21262d]/30 border-b border-[#30363d] flex items-center justify-center relative overflow-hidden">
          {listing.images?.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="text-4xl opacity-50 group-hover:scale-110 transition-transform duration-500">📦</span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-[#c9d1d9] text-[15px] truncate pr-2 group-hover:text-[#22c55e] transition-colors">
              {listing.title}
            </h3>
            <p className="text-[#22c55e] font-black text-lg">₹{listing.price}</p>
          </div>
          
          <div className="flex items-center gap-2 mt-2 mb-3">
            <span className="text-xs font-semibold text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
              {listing.category}
            </span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg font-bold ${conditionColors[listing.condition]}`}>
              {listing.condition}
            </span>
          </div>

          <div className="mt-auto pt-3 border-t border-[#30363d] flex justify-between items-center text-[11px] text-[#8b949e] font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-white text-[8px] uppercase">
                {listing.seller?.name?.[0] || "?"}
              </div>
              <span className="truncate">{listing.seller?.name || "Unknown"}</span>
            </div>
            {listing.createdAt && (
              <span className="flex-shrink-0 ml-2">{new Date(listing.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
