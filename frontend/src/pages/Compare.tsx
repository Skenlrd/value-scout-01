import { useState } from "react";
import { Search, AlertCircle, RefreshCw } from "lucide-react";
import LoadingWidget from "@/components/LoadingWidget";
import ComparisonProductCard from "@/components/ComparisonProductCard";
import ComparisonTable from "@/components/ComparisonTable";

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
  products: ComparisonSource[];
  timestamp: string;
}

const Compare = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [findingMore, setFindingMore] = useState(false);
  const [error, setError] = useState("");
  const [noMoreResults, setNoMoreResults] = useState(false);
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
    setNoMoreResults(false);

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

  // Find more deals - search again and add new unique results
  const handleFindMore = async () => {
    if (!comparisonData) return;
    
    setFindingMore(true);
    setNoMoreResults(false);
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/compare-prices?q=${encodeURIComponent(comparisonData.query)}&offset=${comparisonData.products.length}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch more deals");
      }

      const data = await response.json();
      
      // Filter out duplicates based on source + title combination
      const existingKeys = new Set(
        comparisonData.products.map(p => `${p.source}-${p.title}`)
      );
      
      const newProducts = data.products.filter(
        (p: ComparisonSource) => !existingKeys.has(`${p.source}-${p.title}`)
      );
      
      if (newProducts.length === 0) {
        setNoMoreResults(true);
      } else {
        setComparisonData({
          ...comparisonData,
          products: [...comparisonData.products, ...newProducts]
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error finding more deals");
    } finally {
      setFindingMore(false);
    }
  };

  // Get lowest price source
  const getLowestPriceSource = () => {
    if (!comparisonData) return null;

    const sources = comparisonData.products.filter(s => s && s.price);

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

  // Get available sources for display
  const getAvailableSources = () => {
    if (!comparisonData) return [];
    return comparisonData.products;
  };

  const availableSources = getAvailableSources();

  return (
    <div className="min-h-screen bg-transparent">
      <LoadingWidget isLoading={loading} />

      {/* Header - Same as Style Builder */}
      <div className="px-6 sm:px-10 md:px-16 lg:px-24 py-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-3">
            Compare Deals
          </h1>
          <p className="text-gray-700 mb-8 text-sm md:text-base">
            Find the best deals across multiple retailers
          </p>

          {/* Search Bar - Same style as Style Builder */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="w-full glass-effect rounded-full">
              <form 
                className="relative flex items-center h-16 md:h-20 px-6"
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              >
                <Search 
                  className="absolute left-6 h-6 w-6 text-muted-foreground cursor-pointer hover:text-gray-700 transition-colors" 
                  onClick={handleSearch}
                />
                <input
                  type="text"
                  placeholder="Search for deals, styles, and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-14 pr-6 bg-transparent border-none text-lg font-medium focus:outline-none"
                />
              </form>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-8 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Results Section */}
          {comparisonData && !loading && (
            <div className="mt-10 space-y-10">
              {/* Product Header */}
              <div className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg">
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  Results for "{comparisonData.query}"
                </h2>
                <p className="text-gray-600">
                  Found prices from <span className="font-bold text-brand-scout">{availableSources.length}</span> sources
                </p>
              </div>

              {/* PART 2: SIMILAR PRODUCTS ROW */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-brand-scout to-emerald-500 rounded-full"></span>
                  Compare Prices
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {/* Product Cards */}
                  {availableSources.map((source, index) => (
                    <ComparisonProductCard
                      key={`${source.source}-${index}`}
                      source={source.source}
                      title={source.title}
                      price={source.price}
                      image={source.image}
                      link={source.link}
                      rating={source.rating}
                      isLowest={lowestPriceSource?.source === source.source && lowestPriceSource?.title === source.title}
                    />
                  ))}
                </div>

                {/* Find More Deals Button */}
                <div className="mt-8 flex flex-col items-center gap-3">
                  {noMoreResults ? (
                    <p className="text-gray-500 text-sm">No more deals found for this search</p>
                  ) : (
                    <button
                      onClick={handleFindMore}
                      disabled={findingMore}
                      className="px-6 py-3 bg-brand-scout hover:bg-teal-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${findingMore ? 'animate-spin' : ''}`} />
                      {findingMore ? 'Searching...' : 'Find More Deals'}
                    </button>
                  )}
                </div>
              </div>

              {/* PART 3: DIFFERENTIAL AESTHETIC TABLE */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-brand-scout to-emerald-500 rounded-full"></span>
                  Detailed Comparison
                </h3>
                <ComparisonTable
                  sources={availableSources}
                  lowestPriceSource={lowestPriceSource}
                />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!comparisonData && !loading && !error && (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Start Comparing</h3>
              <p className="text-gray-500 text-sm">
                Enter a product name to compare prices across stores
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compare;
