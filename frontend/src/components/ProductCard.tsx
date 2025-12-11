import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Wand2, Heart, ExternalLink, Star } from "lucide-react";

import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardFooter } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

interface ProductCardProps {
  productId: string;
  productName?: string;
  name?: string;
  price?: number | string;
  imageUrl?: string;
  productUrl?: string;
  source?: string;
  onWishlistToggle?: (product: any) => void;
  isInWishlist?: boolean;
  asin?: string;
}

const formatPrice = (val?: number | string) => {
  if (val === undefined || val === null) return "";
  if (typeof val === "number") return `₹${val}`;
  const s = String(val).trim();
  if (/^[^0-9]+/.test(s)) return s;
  return `₹${s}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ 
  productId, productName, name, price, imageUrl, productUrl, source, onWishlistToggle, isInWishlist, asin
}) => {
  
  const displayName = productName ?? name ?? "";
  const [open, setOpen] = useState(false);
  const [showWishlistConfirm, setShowWishlistConfirm] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle({
        asin,
        title: displayName,
        price: price,
        source: source,
        link: productUrl,
        image: imageUrl
      });
    }
  };

  // Add to wishlist handler for the Star button
  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const user = JSON.parse(localStorage.getItem('valuescout_user') || '{}');
      if (!user.id) {
        alert('Please login to add to wishlist');
        return;
      }

      setIsAddingToWishlist(true);
      const response = await fetch('http://localhost:8000/api/wishlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: displayName,
          price: price,
          source: source || 'Unknown',
          link: productUrl,
          image: imageUrl,
        })
      });

      if (response.ok) {
        setShowWishlistConfirm(true);
        setTimeout(() => setShowWishlistConfirm(false), 2500);
      } else {
        alert('Failed to add to wishlist');
      }
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      alert('Error adding to wishlist');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="group cursor-pointer h-full relative">
        {/* Wishlist Added Confirmation */}
        {showWishlistConfirm && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-50 animate-pulse">
            ✓ Added to Wishlist
          </div>
        )}
        <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow">
          {/* Image Section - Clickable */}
          <a 
            href={productUrl || "#"} 
            target="_blank" 
            rel="noreferrer" 
            className="flex-shrink-0 overflow-hidden"
            onClick={(e) => {
              if (!productUrl) {
                e.preventDefault();
              }
            }}
          >
            <div className="w-full h-56 bg-gray-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={displayName} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Skeleton className="w-full h-full" />
              )}
            </div>
          </a>

          {/* Text Section - Clickable */}
          <a 
            href={productUrl || "#"} 
            target="_blank" 
            rel="noreferrer"
            className="flex-grow flex flex-col p-3 hover:no-underline"
            onClick={(e) => {
              if (!productUrl) {
                e.preventDefault();
              }
            }}
          >
            <div className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-gray-700">{displayName}</div>
            <div className="text-lg font-bold text-black mt-2">{formatPrice(price)}</div>
          </a>

          {/* Footer with Actions */}
          <CardFooter className="flex justify-between items-center gap-2 p-3 border-t">
            <Badge variant="secondary" className="text-xs">{source || "Unknown"}</Badge>

            <div className="flex gap-2">
              {productUrl && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  title="View on retailer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(productUrl, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 text-black" />
                </Button>
              )}

            {/* Wishlist Button - Add to Wishlist */}
              <Button 
                size="sm" 
                variant="ghost" 
                className={`h-8 w-8 p-0 ${showWishlistConfirm ? 'hover:bg-green-100' : 'hover:bg-amber-100'}`}
                title="Add to wishlist"
                onClick={handleAddToWishlist}
                disabled={isAddingToWishlist}
              >
                <Star className={`w-4 h-4 ${showWishlistConfirm ? 'text-green-600 fill-green-600' : 'text-amber-500'}`} />
              </Button>
              
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 hover:bg-gray-200"
                  title="AI Style Builder"
                >
                  <Wand2 className="w-4 h-4 text-black" />
                </Button>
              </DialogTrigger>

              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-red-100"
                title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                onClick={handleWishlistClick}
              >
                <Heart 
                  className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <DialogContent className="sm:max-w-4xl w-[95vw] p-6">
        <AIStyleBuilderModalContent baseProductId={productId} />
      </DialogContent>
    </Dialog>
  );
};

export default ProductCard;


// ------------------------ AI MODAL ------------------------ //

interface AIStyleBuilderModalContentProps {
  baseProductId: string;
}

const AIStyleBuilderModalContent: React.FC<AIStyleBuilderModalContentProps> = ({ baseProductId }) => {

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [baseCategory, setBaseCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [showWishlistConfirm, setShowWishlistConfirm] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call 1 → AI API
        const resp1 = await fetch(`http://localhost:8000/api/style-builder/${encodeURIComponent(baseProductId)}`);
        if (!resp1.ok) throw new Error("AI API error: " + resp1.status);

        const recData = await resp1.json();
        const ids = recData.recommendations?.map((r: any) => r.id) || [];
        const targets: string[] = Array.isArray(recData.target_categories) ? recData.target_categories : [];
        const inputCat: string = (recData.input_category || "").toLowerCase();
        if (!cancelled) {
          setTargetCategories(targets);
          setBaseCategory(inputCat);
        }

        if (ids.length === 0) {
          if (!cancelled) {
            setRecommendedProducts([]);
            setIsLoading(false);
          }
          return;
        }

        // Call 2 → Node products-by-ids
        const resp2 = await fetch(`http://localhost:8000/api/products-by-ids?ids=${ids.join(",")}`);
        if (!resp2.ok) throw new Error("Node API error: " + resp2.status);

        let fullProducts = await resp2.json();

        // Safety filter: keep only products in target categories
        if (targets && targets.length) {
          fullProducts = fullProducts.filter((p: any) => targets.includes((p.category || "").toLowerCase()));
        }

        // De-duplicate by productUrl to avoid repeats
        const seen = new Set<string>();
        fullProducts = fullProducts.filter((p: any) => {
          const key = (p.productUrl || p._id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (!cancelled) {
          setRecommendedProducts(fullProducts);
          setIsLoading(false);
        }

      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => { cancelled = true; };

  }, [baseProductId]);


  return (
    <div style={{ padding: 8 }}>
      {showWishlistConfirm && (
        <div style={{ 
          backgroundColor: "#d1fae5", 
          border: "1px solid #10b981", 
          borderRadius: "8px", 
          padding: "12px", 
          marginBottom: "16px", 
          color: "#047857", 
          fontSize: "14px",
          fontWeight: "500"
        }}>
          ✅ {showWishlistConfirm} added to wishlist! You'll get email alerts when the price drops.
        </div>
      )}
      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>AI Style Suggestions</h3>
      {baseCategory && (
        <div style={{ marginBottom: 12, fontSize: 13, color: "#555" }}>
          Base product category: <strong style={{ textTransform: "capitalize" }}>{baseCategory}</strong>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton style={{ height: 140 }} />
              <Skeleton style={{ height: 16, marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ color: "red" }}>Error: {error}</div>
      ) : recommendedProducts.length === 0 ? (
        <div>No recommendations found.</div>
      ) : (
        (() => {
          // Derive categories present in results (filtered by targetCategories if provided)
          const presentCats = Array.from(
            new Set(
              recommendedProducts
                .map((p) => (p.category || "").toLowerCase())
                .filter((c) => c && (!targetCategories.length || targetCategories.includes(c)))
            )
          );
          const tabs = ["all", ...presentCats];
          if (!tabs.includes(activeTab)) setActiveTab("all");

          const addToWishlist = async (product: any) => {
            try {
              const user = JSON.parse(localStorage.getItem('valuescout_user') || '{}');
              if (!user.id) {
                alert('Please login to add to wishlist');
                return;
              }

              const response = await fetch('http://localhost:8000/api/wishlist/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  title: product.productName || product.name,
                  price: product.price,
                  source: product.source || 'Unknown',
                  link: product.productUrl,
                  image: product.imageUrl,
                })
              });

              if (response.ok) {
                setWishlistItems(prev => new Set([...prev, product._id]));
                setShowWishlistConfirm(product.productName || product.name);
                setTimeout(() => setShowWishlistConfirm(null), 3000);
              }
            } catch (err) {
              console.error('Failed to add to wishlist:', err);
            }
          };

          const renderItems = (items: any[]) => (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {items.map((p) => (
                <div key={p._id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, display: "flex", flexDirection: "column" }}>
                  <a href={p.productUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                    <div style={{ width: "100%", height: 200, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.productName || p.name} style={{ maxWidth: "100%", maxHeight: "100%" }} />
                      ) : (
                        <Skeleton style={{ height: 200 }} />
                      )}
                    </div>
                    <div style={{ marginTop: 10, fontWeight: 600 }}>{p.productName || p.name}</div>
                    <div style={{ marginTop: 6, color: "#666" }}>{formatPrice(p.price)}</div>
                  </a>
                  <Button
                    size="sm"
                    onClick={() => addToWishlist(p)}
                    style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, width: "100%", backgroundColor: wishlistItems.has(p._id) ? "#10b981" : "#d1d5db", color: "white", border: "none", padding: "8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}
                  >
                    <Heart className="w-4 h-4" fill={wishlistItems.has(p._id) ? "white" : "none"} />
                    {wishlistItems.has(p._id) ? "Added to Wishlist" : "Add to Wishlist"}
                  </Button>
                </div>
              ))}
            </div>
          );

          return (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap gap-2 mb-4 bg-transparent p-0">
                {tabs.map((t) => (
                  <TabsTrigger key={t} value={t} className="capitalize">
                    {t === "all" ? "All" : t}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((t) => (
                <TabsContent key={t} value={t}>
                  {renderItems(
                    t === "all"
                      ? recommendedProducts
                      : recommendedProducts.filter((p) => (p.category || "").toLowerCase() === t)
                  )}
                </TabsContent>
              ))}
            </Tabs>
          );
        })()
      )}

    </div>
  );
};
