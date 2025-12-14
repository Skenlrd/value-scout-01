import { Check, X, ExternalLink, Star } from "lucide-react";

interface ProductCardProps {
  source: string;
  title: string | null;
  price: string | number | null;
  image: string | null;
  link: string | null;
  rating: number | null;
  isLowest?: boolean;
}

// Get source-specific styling
const getSourceStyles = (source: string) => {
  const sourceMap: Record<string, { bg: string; badge: string; accent: string }> = {
    amazon: { 
      bg: "from-green-50 to-emerald-50/60", 
      badge: "bg-green-600", 
      accent: "text-green-600" 
    },
    flipkart: { 
      bg: "from-green-50 to-emerald-50/60", 
      badge: "bg-green-600", 
      accent: "text-green-600" 
    },
    myntra: { 
      bg: "from-green-50 to-emerald-50/60", 
      badge: "bg-green-600", 
      accent: "text-green-600" 
    },
    google: { 
      bg: "from-green-50 to-emerald-50/60", 
      badge: "bg-green-600", 
      accent: "text-green-600" 
    },
    nike: { 
      bg: "from-gray-100 to-gray-50/60", 
      badge: "bg-gray-700", 
      accent: "text-gray-700" 
    },
    ubuy: { 
      bg: "from-gray-100 to-gray-50/60", 
      badge: "bg-gray-700", 
      accent: "text-gray-700" 
    },
    default: { 
      bg: "from-green-50 to-emerald-50/60", 
      badge: "bg-green-600", 
      accent: "text-green-600" 
    }
  };
  
  const key = source.toLowerCase();
  for (const [k, v] of Object.entries(sourceMap)) {
    if (key.includes(k)) return v;
  }
  return { bg: "from-teal-50 to-emerald-50/60", badge: "bg-brand-scout", accent: "text-brand-scout" };
};

const ComparisonProductCard = ({
  source,
  title,
  price,
  image,
  link,
  rating,
  isLowest = false
}: ProductCardProps) => {
  const getProsCons = (sourceName: string) => {
    const proCons: Record<string, { pros: string[]; cons: string[] }> = {
      amazon: {
        pros: ["Prime delivery", "Best return policy"],
        cons: ["Price fluctuates"]
      },
      flipkart: {
        pros: ["Easy returns", "Great offers"],
        cons: ["Stock varies"]
      },
      myntra: {
        pros: ["Fashion focused", "Try & Buy"],
        cons: ["Limited electronics"]
      },
      nike: {
        pros: ["Authentic products", "Member deals"],
        cons: ["Premium pricing"]
      },
      google: {
        pros: ["Multiple sellers", "Price transparency"],
        cons: ["Varies by seller"]
      }
    };
    const key = sourceName.toLowerCase();
    for (const [k, v] of Object.entries(proCons)) {
      if (key.includes(k)) return v;
    }
    return { pros: ["Verified seller"], cons: ["Check availability"] };
  };

  const prosCons = getProsCons(source);
  const sourceStyles = getSourceStyles(source);
  
  const formatPrice = (p: string | number | null) => {
    if (!p) return "N/A";
    if (typeof p === "string") return p;
    return `₹${p.toLocaleString("en-IN")}`;
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden backdrop-blur-md border-2 border-white/50 transition-all duration-300 flex flex-col min-h-[480px] hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${sourceStyles.bg} shadow-md`}
    >
      {/* Header with Source Badge */}
      <div
        className="px-4 py-3 border-b bg-white/40 border-white/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold text-white px-3 py-1.5 rounded-full ${sourceStyles.badge}`}>
            {source}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Image */}
        <div className="mb-4 h-44 bg-white rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-inner">
          {image ? (
            <img
              src={image}
              alt={title || "Product"}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
              }}
            />
          ) : (
            <span className="text-gray-400 text-sm">No Image</span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2 min-h-10">
          {title || "Product"}
        </h4>

        {/* Price - Large & Bold */}
        <div className="text-3xl font-black mb-2 text-gray-800">
          {formatPrice(price)}
        </div>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-3">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{rating}</span>
          </div>
        )}

        {/* Pros & Cons */}
        <div className="space-y-2.5 flex-1 text-xs">
          {/* Pros */}
          <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
            <ul className="space-y-1">
              {prosCons.pros.map((pro, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-green-700">
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
            <ul className="space-y-1">
              {prosCons.cons.map((con, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-red-600">
                  <X className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* View Button - Always show, use search link if no direct link */}
        <a
          href={link || `https://www.google.com/search?q=${encodeURIComponent(title || "product")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 w-full py-3 px-3 rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2 ${sourceStyles.badge} hover:opacity-90 text-white shadow-md`}
        >
          <ExternalLink className="w-4 h-4" />
          View Deal
        </a>
      </div>
    </div>
  );
};

export default ComparisonProductCard;
