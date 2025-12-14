import { useState, useEffect } from "react";
import { Heart, ExternalLink, Trash2, TrendingDown, CheckCircle2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";

interface WishlistItem {
  _id?: string;
  userId: string;
  title: string;
  price?: string | number;
  source?: string;
  link?: string;
  image?: string;
  thumbnail?: string;
  targetPrice?: number | string | null;
}

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [priceAlerts, setPriceAlerts] = useState<{ [key: string]: number }>({});
  const [priceInputs, setPriceInputs] = useState<{ [key: string]: string }>({});
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [priceAlertConfirm, setPriceAlertConfirm] = useState<{ title: string; price: number } | null>(null);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || null;

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      setLoading(false);
      return;
    }
    fetchWishlist();
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const items: WishlistItem[] = data.items || [];
        setWishlistItems(items);

        // Prefill per-item target price inputs from server so "tracked" state persists across reloads.
        const nextInputs: { [key: string]: string } = {};
        const nextAlerts: { [key: string]: number } = {};
        for (const item of items) {
          const id = item._id || "";
          if (!id) continue;
          const targetNum =
            typeof item.targetPrice === "number"
              ? item.targetPrice
              : typeof item.targetPrice === "string"
                ? Number(item.targetPrice)
                : NaN;
          if (!Number.isNaN(targetNum) && targetNum > 0) {
            nextInputs[id] = String(targetNum);
            nextAlerts[id] = targetNum;
          }
        }
        setPriceInputs(nextInputs);
        setPriceAlerts(nextAlerts);
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
    if (!isAuthenticated || !userId) {
      setShowAuthDialog(true);
      return;
    }
    
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

        // Update local UI immediately (and keep input synced)
        setWishlistItems((prev) =>
          prev.map((item) => (item._id === itemId ? { ...item, targetPrice } : item))
        );
        setPriceInputs((prev) => ({ ...prev, [itemId]: String(targetPrice) }));
        
        // Show confirmation message
        const item = wishlistItems.find(i => i._id === itemId);
        setPriceAlertConfirm({ 
          title: item?.title || 'Product', 
          price: targetPrice 
        });
        
        // Auto-dismiss after 4 seconds
        setTimeout(() => setPriceAlertConfirm(null), 4000);
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
        <AuthRequiredDialog 
          open={showAuthDialog}
          onOpenChange={(open) => {
            setShowAuthDialog(open);
            if (!open && !isAuthenticated) {
              navigate("/");
            }
          }}
          feature="wishlist and price tracking"
        />
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
        <AuthRequiredDialog 
          open={showAuthDialog}
          onOpenChange={(open) => {
            setShowAuthDialog(open);
            if (!open) {
              navigate("/");
            }
          }}
          feature="wishlist and price tracking"
        />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Login Required</h1>
          <p className="text-gray-700 mb-6">Please login to view your wishlist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      <div className="container mx-auto px-4 py-16">
        {/* Price Alert Confirmation */}
        {priceAlertConfirm && (
          <div className="mb-6 max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg shadow-md p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-green-700">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-green-900">Price Tracked Successfully!</h4>
                <p className="text-green-800 text-sm mt-1">
                  <strong>{priceAlertConfirm.title}</strong> is now being tracked.
                </p>
                <p className="text-green-700 text-sm">
                  We'll send you an email notification when the price drops below ₹{priceAlertConfirm.price.toLocaleString('en-IN')}.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Wishlist & Price Tracker
          </h1>
          <p className="text-gray-700 text-base">
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
                className={`rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full ${
                  (typeof item.targetPrice === "number" && item.targetPrice > 0) ||
                  (typeof item.targetPrice === "string" && Number(item.targetPrice) > 0)
                    ? "bg-amber-50/60 border-amber-200"
                    : "bg-white"
                }`}
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

                  {/* Tracked badge */}
                  {((typeof item.targetPrice === "number" && item.targetPrice > 0) ||
                    (typeof item.targetPrice === "string" && Number(item.targetPrice) > 0)) && (
                    <div className="mb-2">
                      <Badge
                        variant="outline"
                        className="w-fit border-amber-200 bg-amber-100/60 text-amber-900"
                      >
                        <BellRing className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                        Tracking below ₹
                        {Number(item.targetPrice).toLocaleString("en-IN")}
                      </Badge>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-3">
                    <p className="text-2xl font-bold text-black">
                      {typeof item.price === "string" ? item.price : `₹${item.price}`}
                    </p>
                    {((typeof item.targetPrice === "number" && item.targetPrice > 0) ||
                      (typeof item.targetPrice === "string" && Number(item.targetPrice) > 0)) && (
                      <p className="mt-1 text-xs font-medium text-amber-800">
                        Price tracking enabled
                      </p>
                    )}
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
                      {((typeof item.targetPrice === "number" && item.targetPrice > 0) ||
                      (typeof item.targetPrice === "string" && Number(item.targetPrice) > 0))
                        ? "Update Price Tracking"
                        : "Set Price Alert"}
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
