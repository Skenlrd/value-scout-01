import { useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import DealCard from "../components/DealCard";
import WishlistCard from "../components/WishlistCard";
import AuthRequiredDialog from "../components/AuthRequiredDialog";
import useAuth from "../hooks/useAuth";
// Import the video file
import heroVideo from "../assets/video1.mp4";

interface SearchResult {
  productName?: string;
  title?: string;
  price: string | number;
  source: string;
  image?: string;
  thumbnail?: string;
  link?: string;
  rating?: number | string;
  reviews?: number | string;
  asin?: string;
}

interface WishlistItem {
  _id?: string;
  userId: string;
  title: string;
  price?: string | number;
  source?: string;
  link?: string;
  image?: string;
  thumbnail?: string;
}

const Home = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [trendingDeals, setTrendingDeals] = useState<SearchResult[]>([]);
  const [lowestDeals, setLowestDeals] = useState<SearchResult[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [lowestLoading, setLowestLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || null;

  // Brand names to filter (high-end fashion & shoes)
  const brandNames = [
    "Nike", "Adidas", "Puma", "Reebok", "New Balance",
    "Gucci", "Louis Vuitton", "Prada", "Dior", "Chanel",
    "Tommy Hilfiger", "Calvin Klein", "Hugo Boss", "Lacoste",
    "Zara", "H&M", "Levi's", "Diesel", "Armani", "Ralph Lauren",
    "Skechers", "Converse", "Vans", "Timberland", "Dr Martens"
  ];

  const isFashionOrShoes = (name: string): boolean => {
    const lowerName = name.toLowerCase();
    // Check if it's shoes or fashion related
    const fashionKeywords = ["shoe", "sneaker", "boot", "sandal", "slipper", "heel", 
                              "shirt", "pant", "dress", "jacket", "coat", "sweater", 
                              "t-shirt", "jeans", "trouser", "top", "bottom", "outfit",
                              "apparel", "wear", "fashion"];
    
    return fashionKeywords.some(keyword => lowerName.includes(keyword));
  };

  const isBrandName = (name: string): boolean => {
    return brandNames.some(brand => name.toLowerCase().includes(brand.toLowerCase()));
  };

  const filterResults = (results: SearchResult[]): SearchResult[] => {
    // Temporarily less restrictive filter - just check if it has a price/link
    return results.filter(product => {
      const hasLink = product.link && product.link.length > 0;
      const hasPrice = product.price !== undefined && product.price !== null;
      return hasLink; // Just need a link
    });
  };

  // Fetch wishlist on component mount
  useEffect(() => {
    fetchWishlist();
    fetchTrendingDeals();
    fetchLowestDeals();
  }, []);

  const fetchWishlist = async () => {
    setWishlistLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/wishlist/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data || []);
        
        // Populate wishlist set for UI indicators
        const wishlistSet = new Set<string>();
        (data || []).forEach((item: WishlistItem) => {
          wishlistSet.add(item._id || item.title);
        });
        setWishlist(wishlistSet);
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchTrendingDeals = async () => {
    setTrendingLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/external-search?q=nike shoes"
      );
      if (response.ok) {
        const data = await response.json();
        if (data.all && Array.isArray(data.all)) {
          const filtered = filterResults(data.all).slice(0, 4);
          setTrendingDeals(filtered);
        }
      }
    } catch (err) {
      console.error("Failed to fetch trending deals:", err);
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchLowestDeals = async () => {
    setLowestLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/external-search?q=adidas"
      );
      if (response.ok) {
        const data = await response.json();
        if (data.all && Array.isArray(data.all)) {
          const filtered = filterResults(data.all).slice(0, 4);
          setLowestDeals(filtered);
        }
      }
    } catch (err) {
      console.error("Failed to fetch lowest deals:", err);
    } finally {
      setLowestLoading(false);
    }
  };

  const getProductName = (product: SearchResult): string => {
    return product.productName || product.title || "Unknown Product";
  };

  const toggleWishlist = (product: SearchResult) => {
    const productId = product.asin || getProductName(product);
    const newWishlist = new Set(wishlist);
    
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId);
      removeFromWishlist(product);
    } else {
      newWishlist.add(productId);
      saveToWishlist(product);
    }
    setWishlist(newWishlist);
  };

  const saveToWishlist = async (product: SearchResult) => {
    try {
      const response = await fetch("http://localhost:8000/api/wishlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          title: getProductName(product),
          price: product.price,
          source: product.source,
          link: product.link,
          image: product.image || product.thumbnail,
        }),
      });
      if (response.ok) {
        fetchWishlist(); // Refresh wishlist
      }
    } catch (err) {
      console.error("Failed to save to wishlist:", err);
    }
  };

  const removeFromWishlist = async (product: SearchResult) => {
    if (!isAuthenticated || !userId) {
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/api/wishlist/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          title: getProductName(product),
          asin: product.asin,
        }),
      });
      if (response.ok) {
        fetchWishlist(); // Refresh wishlist
      }
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError("");

    try {
      // Call the Node.js backend on port 8000 (searches external API + database)
      const response = await fetch(
        `http://localhost:8000/api/external-search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Search response:", data);

      if (data.all && Array.isArray(data.all)) {
        // Filter to show only brand-name fashion/shoes
        const filteredResults = filterResults(data.all);
        console.log("Filtered results:", filteredResults);
        
        if (filteredResults.length > 0) {
          setSearchResults(filteredResults);
          setShowResults(true);
        } else {
          setError("No results found matching your criteria");
          setShowResults(false);
        }
      } else {
        console.warn("No 'all' array in response:", data);
        setError("No results found");
        setShowResults(false);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setShowResults(false);
    } finally {
      setSearchLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      {/* Auth Required Dialog */}
      <AuthRequiredDialog 
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        feature="wishlist and price tracking"
      />

      {/* Hero Section with Search */}
      <section className="relative h-[60vh] max-h-[500px] overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ filter: "brightness(0.8)" }}
        >
          {/* Use the imported video variable here */}
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Search Overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search Results Section - Shows Right Below Hero */}
        {searchLoading && (
          <div className="text-center mb-12 animate-pulse">
            <div className="inline-flex items-center gap-3 justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              <p className="text-lg font-semibold text-gray-700">Searching for your perfect style...</p>
            </div>
          </div>
        )}

        {!searchLoading && !showResults && searchQuery && !error && (
          <div className="mb-12">
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No items found</p>
              <p className="text-gray-400 text-sm mt-2">Try 'Nike shoes' or 'Adidas jacket'</p>
            </div>
          </div>
        )}

        {showResults && !searchLoading && searchResults.length > 0 && (
          <section className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Results for "{searchQuery}"</h2>
              <p className="text-gray-600 text-sm">Found {searchResults.length} items</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {searchResults.map((product, index) => {
                const productId = product.asin || getProductName(product);
                const isInWishlist = wishlist.has(productId);
                const productImage = product.image || product.thumbnail;
                const productName = getProductName(product);
                return (
                  <div key={index} className="relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                    {/* Wishlist Icon */}
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full hover:bg-gray-50 transition-colors"
                      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <svg
                        className={`w-5 h-5 transition-colors ${
                          isInWishlist
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    {/* Product Image */}
                    {productImage && (
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/200?text=Product";
                          }}
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-3 text-gray-800">
                        {productName}
                      </h3>

                      {/* Price */}
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <span className="text-xl font-bold text-gray-900">
                          {typeof product.price === "string"
                            ? product.price
                            : `₹${product.price}`}
                        </span>
                      </div>

                      {/* Source & Rating */}
                      <div className="flex items-center justify-between mb-4 text-xs">
                        <span className="text-gray-600 font-medium">
                          {product.source}
                        </span>
                        {product.rating && (
                          <span className="text-yellow-600">⭐ {product.rating}</span>
                        )}
                      </div>

                      {/* View Deal Button */}
                      <button
                        onClick={() => {
                          if (product.link) {
                            window.open(product.link, "_blank");
                          }
                        }}
                        className="w-full bg-black text-white py-2 rounded font-medium text-sm hover:bg-gray-800 active:bg-gray-900 transition-colors"
                      >
                        View Deal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Discover Your Perfect Style</h2>
          <p className="text-gray-600 text-lg">
            Compare deals, build your AI-powered wardrobe, and shop smarter with
            ValueScout.
          </p>
        </div>

        {/* Top Trending Deals Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Top Trending Deals</h2>
          {trendingLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <span className="text-gray-600">Loading trending deals...</span>
              </div>
            </div>
          ) : trendingDeals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingDeals.map((product, index) => {
                const productId = product.asin || getProductName(product);
                const isWishlisted = wishlist.has(productId);
                return (
                  <ProductCard
                    key={index}
                    productName={getProductName(product)}
                    price={typeof product.price === "string" ? product.price : `₹${product.price}`}
                    productId={productId}
                    asin={product.asin}
                    imageUrl={product.image || product.thumbnail}
                    source={product.source}
                    productUrl={product.link}
                    onWishlistToggle={toggleWishlist}
                    isInWishlist={isWishlisted}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No trending deals found</p>
            </div>
          )}
        </section>

        {/* Lowest This Month Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Lowest This Month</h2>
          {lowestLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <span className="text-gray-600">Loading lowest deals...</span>
              </div>
            </div>
          ) : lowestDeals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {lowestDeals.map((product, index) => {
                const productId = product.asin || getProductName(product);
                const isWishlisted = wishlist.has(productId);
                return (
                  <DealCard
                    key={index}
                    name={getProductName(product)}
                    currentPrice={typeof product.price === "string" ? product.price : `₹${product.price}`}
                    priceDrop="Best Deal"
                    image={product.image || product.thumbnail}
                    link={product.link}
                    source={product.source}
                    asin={product.asin}
                    onWishlistToggle={toggleWishlist}
                    isInWishlist={isWishlisted}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No lowest deals found</p>
            </div>
          )}
        </section>

        {/* Wishlist Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            Your Wishlist - Price Alerts
          </h2>
          {wishlistLoading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <span className="text-gray-600">Loading wishlist...</span>
              </div>
            </div>
          ) : wishlistItems.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4">
                {wishlistItems.map((item, index) => (
                  <WishlistCard
                    key={index}
                    name={item.title}
                    currentPrice={typeof item.price === "string" ? item.price : `₹${item.price || "N/A"}`}
                    priceChange={`From ${item.source || "Marketplace"}`}
                    details="Saved for later"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 text-lg">Your wishlist is empty</p>
              <p className="text-gray-400 text-sm mt-2">Add items from search results to track prices</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;

