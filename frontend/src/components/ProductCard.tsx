import React, { useState, useEffect } from "react";
import { Wand2 } from "lucide-react";

import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardFooter } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

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

      <DialogContent>
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

        const fullProducts = await resp2.json();

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
    <div style={{ padding: 16, minWidth: 320 }}>
      <h3 style={{ fontSize: 20, fontWeight: 600 }}>AI Style Suggestions</h3>

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>

          {recommendedProducts.map((p) => (
            <div key={p._id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
              <a href={p.productUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ width: "100%", height: 140, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.imageUrl 
                    ? <img src={p.imageUrl} alt={p.productName || p.name} style={{ maxWidth: "100%", maxHeight: "100%" }} />
                    : <Skeleton style={{ height: 140 }} />
                  }
                </div>

                <div style={{ marginTop: 8, fontWeight: 600 }}>{p.productName || p.name}</div>
                <div style={{ marginTop: 4, color: "#666" }}>{formatPrice(p.price)}</div>
              </a>
            </div>
          ))}

        </div>
      )}

    </div>
  );
};
