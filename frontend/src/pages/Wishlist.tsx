import { useState, useEffect } from "react";
import { Heart, ExternalLink, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WishlistItem {
  _id?: string;
  userId: string;
  title: string;
  price?: string | number;
  source?: string;
  link?: string;
  image?: string;
  thumbnail?: string;
  targetPrice?: number;
}

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = "guest";
  const [priceAlerts, setPriceAlerts] = useState<{ [key: string]: number }>({});
  const [priceInputs, setPriceInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.items || []);
      } else {
        setError("Failed to load wishlist");
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string, title: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/wishlist/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          itemId: itemId,
        }),
      });

      if (response.ok) {
        setWishlistItems(wishlistItems.filter((item) => item._id !== itemId));
        console.log(`✅ Item removed from wishlist`);
      } else {
        console.error("Failed to remove item");
      }
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  const handlePriceAlert = async (itemId: string, targetPrice: number) => {
    if (!targetPrice || targetPrice <= 0) {
      console.warn("Invalid target price");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/wishlist/price-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          itemId: itemId,
          targetPrice: targetPrice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Price alert set for ₹${targetPrice}`);
        setPriceAlerts({
          ...priceAlerts,
          [itemId]: targetPrice,
        });
      } else {
        console.error("Failed to set price alert");
      }
    } catch (err) {
      console.error("Failed to set price alert:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
              <span className="text-gray-600">Loading your wishlist...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Wishlist & Price Tracker
          </h1>
          <p className="text-gray-700 text-lg">
            {wishlistItems.length === 0
              ? "Your wishlist is empty. Start adding items!"
              : `${wishlistItems.length} item${wishlistItems.length !== 1 ? "s" : ""} in your wishlist`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Wishlist Items Grid */}
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <Card
                key={item._id}
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                {/* Image Section */}
                <div className="relative h-64 bg-gray-100 overflow-hidden">
                  {item.image || item.thumbnail ? (
                    <img
                      src={item.image || item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/300?text=Product";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Remove Button Overlay */}
                  <button
                    onClick={() => removeFromWishlist(item._id || "", item.title)}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-lg"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                    {item.title}
                  </h3>

                  {/* Price */}
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-black">
                      {typeof item.price === "string" ? item.price : `₹${item.price}`}
                    </p>
                  </div>

                  {/* Source and Divider */}
                  <div className="border-t border-gray-200 py-3 mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {item.source || "Unknown Source"}
                    </p>
                  </div>

                  {/* Price Alert Input */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Set Price Alert
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Target price"
                        value={priceInputs[item._id || ""] || ""}
                        onChange={(e) =>
                          setPriceInputs({
                            ...priceInputs,
                            [item._id || ""]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        title="Set price alert"
                        onClick={() =>
                          handlePriceAlert(
                            item._id || "",
                            parseFloat(priceInputs[item._id || ""] || "0")
                          )
                        }
                      >
                        <TrendingDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    {item.link && (
                      <Button
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        onClick={() => window.open(item.link, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Deal
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-white/60 backdrop-blur-sm mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Wishlist is Empty</h2>
            <p className="text-gray-700 text-lg mb-8 max-w-md mx-auto">
              Start adding products you love by clicking the heart icon on any item
            </p>
            <a
              href="/"
              className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Browse Products
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
