import { Link } from "react-router-dom";

const conditionColors = {
  new: "bg-green-100 text-green-700",
  "like-new": "bg-blue-100 text-blue-700",
  good: "bg-yellow-100 text-yellow-700",
  fair: "bg-orange-100 text-orange-700",
};

export default function ListingCard({ listing }) {
  return (
    <Link to={`/listings/${listing._id}`}>
      <div className="bg-[#161b22]/85 border border-[#30363d] rounded-xl shadow-lg hover:shadow-2xl hover:border-slate-500/30 transition overflow-hidden">
        {/* Image */}
        <div className="h-40 bg-[#21262d]/30 border-b border-[#30363d] flex items-center justify-center">
          {listing.images?.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">📦</span>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-semibold text-[#c9d1d9] text-sm truncate">
            {listing.title}
          </h3>
          <p className="text-[#58a6ff] font-bold mt-1">₹{listing.price}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{listing.category}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionColors[listing.condition]}`}
            >
              {listing.condition}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
            <span>by {listing.seller?.name || "Unknown"}</span>
            {listing.createdAt && (
              <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
