import React, { useState, useEffect } from "react";
import { Wand2 } from "lucide-react";

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
}

const formatPrice = (val?: number | string) => {
  if (val === undefined || val === null) return "";
  if (typeof val === "number") return `₹${val}`;
  const s = String(val).trim();
  if (/^[^0-9]+/.test(s)) return s;
  return `₹${s}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ 
  productId, productName, name, price, imageUrl, productUrl, source 
}) => {
  
  const displayName = productName ?? name ?? "";
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        <Card style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <a href={productUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>

            <div style={{ width: "100%", height: 220, backgroundColor: "#f3f3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {imageUrl ? (
                <img src={imageUrl} alt={displayName} style={{ maxWidth: "100%", maxHeight: "100%" }} />
              ) : (
                <Skeleton style={{ height: 220 }} />
              )}
            </div>

            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{displayName}</div>
              <div style={{ color: "#666", marginTop: 6 }}>{formatPrice(price)}</div>
            </div>

          </a>

          <CardFooter style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12 }}>
            <Badge>{source || "Unknown"}</Badge>

            <DialogTrigger asChild>
              <Button aria-label="AI Style Builder" title="Build outfit suggestions">
                <Wand2 />
              </Button>
            </DialogTrigger>
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

          const renderItems = (items: any[]) => (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {items.map((p) => (
                <div key={p._id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                  <a href={p.productUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
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
