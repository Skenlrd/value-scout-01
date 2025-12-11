import { useState, useEffect } from "react";
import { Search, AlertCircle } from "lucide-react";

interface ComparisonSource {
  source: string;
  title: string | null;
  price: string | number | null;
  image: string | null;
  link: string | null;
  rating: number | null;
  reviews: number | null;
}

interface ComparisonResult {
  query: string;
  sources: {
    local: ComparisonSource | null;
    amazon: ComparisonSource | null;
    flipkart: ComparisonSource | null;
  };
  timestamp: string;
}

const Compare = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setError("Please enter a product name");
      return;
    }

    setLoading(true);
    setError("");
    setComparisonData(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/compare-prices?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comparison data");
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching comparison data");
    } finally {
      setLoading(false);
    }
  };

  // Determine which source has the lowest price
  const getLowestPriceSource = () => {
    if (!comparisonData) return null;

    const sources = [
      comparisonData.sources.local,
      comparisonData.sources.amazon,
      comparisonData.sources.flipkart
    ].filter(s => s && s.price);

    if (sources.length === 0) return null;

    return sources.reduce((lowest, current) => {
      const lowestPrice = typeof lowest.price === "string" 
        ? parseFloat(lowest.price.replace(/[^\d.]/g, ""))
        : lowest.price;
      const currentPrice = typeof current.price === "string"
        ? parseFloat(current.price.replace(/[^\d.]/g, ""))
        : current.price;

      return currentPrice < lowestPrice ? current : lowest;
    });
  };

  const lowestPriceSource = getLowestPriceSource();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Price Comparison</h1>
      </div>

      {/* Search Section - Large Centered Bar like AI Style Builder */}
      <div className="flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for deals, prices, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-12 pr-6 py-3 bg-white/80 text-gray-900 placeholder-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-8 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
                <span className="text-gray-700">Comparing prices...</span>
              </div>
            </div>
          )}

          {/* Comparison Results */}
          {comparisonData && !loading && (
            <div className="mt-12">
              {/* Product Header */}
              <div className="mb-12 p-6 bg-white/40 rounded-lg border border-white/30">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{comparisonData.query}</h2>
                <p className="text-gray-700">Best prices from Local DB, Amazon, and Flipkart</p>
              </div>

              {/* Comparison Cards Grid - 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  { key: "local", label: "Local DB", data: comparisonData.sources.local },
                  { key: "amazon", label: "Amazon", data: comparisonData.sources.amazon },
                  { key: "flipkart", label: "Flipkart", data: comparisonData.sources.flipkart }
                ].map(({ key, label, data }) => {
                  const isLowestPrice = data && lowestPriceSource && data.source === lowestPriceSource.source;
                  
                  return (
                    <div
                      key={key}
                      className={`rounded-lg overflow-hidden border-2 transition-all bg-white/60 backdrop-blur-sm ${
                        isLowestPrice
                          ? "border-green-500 shadow-lg"
                          : "border-white/30"
                      }`}
                    >
                      {/* Store Header */}
                      <div className={`px-6 py-4 ${isLowestPrice ? "bg-green-100" : "bg-white/40"}`}>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center justify-between">
                          {label}
                          {isLowestPrice && (
                            <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-semibold">
                              Best Price
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        {data ? (
                          <>
                            {/* Image */}
                            {data.image && (
                              <div className="mb-4 h-48 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                                <img
                                  src={data.image}
                                  alt={data.title || "Product"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/200?text=No+Image";
                                  }}
                                />
                              </div>
                            )}

                            {/* Title */}
                            <h4 className="text-gray-900 font-semibold mb-3 line-clamp-2 text-sm">
                              {data.title}
                            </h4>

                            {/* Price */}
                            <div className={`text-3xl font-bold mb-4 ${isLowestPrice ? "text-green-600" : "text-gray-900"}`}>
                              {typeof data.price === "string"
                                ? data.price
                                : `₹${data.price?.toLocaleString("en-IN")}`}
                            </div>

                            {/* Rating */}
                            {data.rating && (
                              <div className="flex items-center gap-2 mb-4 text-gray-700">
                                <span className="text-yellow-500">⭐</span>
                                <span>{data.rating}</span>
                                {data.reviews && <span className="text-gray-600">({data.reviews} reviews)</span>}
                              </div>
                            )}

                            {/* Link Button */}
                            {data.link && (
                              <a
                                href={data.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block w-full py-2 px-4 rounded-lg font-semibold text-center transition-colors ${
                                  isLowestPrice
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-black hover:bg-gray-800 text-white"
                                }`}
                              >
                                View on {label}
                              </a>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium">Not Available</p>
                            <p className="text-gray-600 text-sm">Product not found on {label}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Summary Table */}
              {comparisonData && (
                <div className="bg-white/40 rounded-lg border border-white/30 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/30 bg-white/60">
                        <th className="text-left py-4 px-6 text-gray-900 font-semibold">Source</th>
                        <th className="text-left py-4 px-6 text-gray-900 font-semibold">Price</th>
                        <th className="text-left py-4 px-6 text-gray-900 font-semibold">Rating</th>
                        <th className="text-left py-4 px-6 text-gray-900 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Local DB", data: comparisonData.sources.local },
                        { label: "Amazon", data: comparisonData.sources.amazon },
                        { label: "Flipkart", data: comparisonData.sources.flipkart }
                      ].map(({ label, data }) => (
                        <tr key={label} className="border-b border-white/20 hover:bg-white/50">
                          <td className="py-4 px-6 text-gray-900 font-medium">{label}</td>
                          <td className={`py-4 px-6 font-semibold ${lowestPriceSource?.source === data?.source ? "text-green-600" : "text-gray-900"}`}>
                            {data ? (typeof data.price === "string" ? data.price : `₹${data.price}`) : "—"}
                          </td>
                          <td className="py-4 px-6 text-gray-700">
                            {data?.rating ? `⭐ ${data.rating}` : "—"}
                          </td>
                          <td className="py-4 px-6">
                            {data?.link ? (
                              <a
                                href={data.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 underline"
                              >
                                Visit
                              </a>
                            ) : (
                              <span className="text-gray-600">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!comparisonData && !loading && !error && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Comparing</h3>
              <p className="text-gray-700">Enter a product name above to compare prices across stores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compare;
