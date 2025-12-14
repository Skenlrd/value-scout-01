import { Check, X, Star, Truck, Package } from "lucide-react";

interface ComparisonSource {
  source: string;
  title: string | null;
  price: string | number | null;
  image: string | null;
  link: string | null;
  rating: number | null;
  reviews: number | null;
}

interface ComparisonTableProps {
  sources: ComparisonSource[];
  lowestPriceSource: ComparisonSource | null;
}

// Get source-specific badge color
const getSourceBadgeClass = (source: string) => {
  const sourceMap: Record<string, string> = {
    amazon: "bg-amber-500",
    flipkart: "bg-blue-500",
    myntra: "bg-pink-500",
    google: "bg-teal-500",
    nike: "bg-gray-800"
  };
  const key = source.toLowerCase();
  for (const [k, v] of Object.entries(sourceMap)) {
    if (key.includes(k)) return v;
  }
  return "bg-brand-scout";
};

const ComparisonTable = ({ sources, lowestPriceSource }: ComparisonTableProps) => {
  const formatPrice = (price: string | number | null) => {
    if (!price) return "—";
    if (typeof price === "string") return price;
    return `₹${price.toLocaleString("en-IN")}`;
  };

  // Source-specific pros and cons
  const getProsCons = (source: ComparisonSource) => {
    const sourceName = source.source.toLowerCase();
    
    const proCons: Record<string, { pros: string[]; cons: string[] }> = {
      amazon: {
        pros: ["Prime delivery", "Best return policy", "Wide selection"],
        cons: ["Price fluctuates"]
      },
      flipkart: {
        pros: ["Competitive prices", "Easy returns", "Good offers"],
        cons: ["Stock varies"]
      },
      myntra: {
        pros: ["Fashion focused", "Try & Buy option", "Style advice"],
        cons: ["Limited electronics"]
      },
      nike: {
        pros: ["100% Authentic", "Member exclusive deals", "Premium quality"],
        cons: ["Premium pricing"]
      },
      google: {
        pros: ["Multiple sellers", "Price transparency", "Comparison"],
        cons: ["Varies by seller"]
      }
    };

    for (const [k, v] of Object.entries(proCons)) {
      if (sourceName.includes(k)) return v;
    }
    return { pros: ["Verified seller", "Good quality"], cons: ["Check availability"] };
  };

  // Get shipping info based on source
  const getShippingInfo = (source: string) => {
    const sourceName = source.toLowerCase();
    if (sourceName.includes("amazon")) return "2-3 days (Prime)";
    if (sourceName.includes("flipkart")) return "3-5 days";
    if (sourceName.includes("myntra")) return "3-7 days";
    if (sourceName.includes("nike")) return "5-7 days";
    return "3-5 days";
  };

  const rows = [
    { label: "Price", key: "price", icon: null },
    { label: "Rating", key: "rating", icon: Star },
    { label: "Availability", key: "availability", icon: Package },
    { label: "Shipping", key: "shipping", icon: Truck },
    { label: "Pros", key: "pros", icon: Check },
    { label: "Cons", key: "cons", icon: X }
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/30 shadow-xl backdrop-blur-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-green-100/60 border-b border-green-200/40">
            <th className="text-left py-5 px-6 font-bold text-gray-800">Feature</th>
            {sources.map((source) => (
              <th
                key={source.source}
                className="text-center py-5 px-6 border-l border-green-200/40 bg-green-50/40"
              >
                <span className={`inline-block text-white font-bold text-sm px-3 py-1.5 rounded-full ${getSourceBadgeClass(source.source)}`}>
                  {source.source}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.key}
              className={`border-b border-white/20 transition-all duration-200 ${
                rowIndex % 2 === 0 
                  ? "bg-white/60" 
                  : "bg-gradient-to-r from-teal-50/40 to-emerald-50/40"
              } hover:bg-teal-50/60`}
            >
              <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                  {row.icon && <row.icon className="w-4 h-4 text-brand-scout" />}
                  <span className="font-semibold text-gray-800">{row.label}</span>
                </div>
              </td>
              {sources.map((source) => (
                <td key={`${source.source}-${row.key}`} className="py-4 px-6 border-l border-white/20 text-center">
                  {row.key === "price" && (
                    <div className="text-xl font-black text-gray-800">
                      {formatPrice(source.price)}
                    </div>
                  )}
                  {row.key === "rating" && (
                    <div className="text-gray-800 font-medium flex items-center justify-center gap-1.5">
                      {source.rating ? (
                        <>
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{source.rating}</span>
                          {source.reviews && (
                            <span className="text-xs text-gray-500">({source.reviews})</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  )}
                  {row.key === "availability" && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-green-700 font-semibold">In Stock</span>
                    </div>
                  )}
                  {row.key === "shipping" && (
                    <div className="text-gray-700 font-medium">
                      {getShippingInfo(source.source)}
                    </div>
                  )}
                  {row.key === "pros" && (
                    <ul className="space-y-1.5">
                      {getProsCons(source).pros.map((pro, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-emerald-700 text-sm">
                          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {row.key === "cons" && (
                    <ul className="space-y-1.5">
                      {getProsCons(source).cons.map((con, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-red-600 text-sm">
                          <X className="w-4 h-4 flex-shrink-0 text-red-500" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
