import React, { useState, useEffect } from "react";
import { Wand2 } from "lucide-react";
// Change: from "../ui/Dialog" to "./ui/dialog"
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog"; 
// Change: from "../ui/Badge" to "./ui/badge"
import { Badge } from "./ui/badge"; 
// Change: from "../ui/Button" to "./ui/button"
import { Button } from "./ui/button"; 
// ... rest of the fileadjust import path
import { Skeleton } from "./ui/skeleton";// adjust import path for Skeleton if needed

interface ProductCardProps {
  productId: string;
  productName: string;
  price?: number;
  imageUrl?: string;
  productUrl?: string;
  source?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ productId, productName, price, imageUrl, productUrl, source }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div>
        <Card style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <a href={productUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ width: "100%", height: 220, backgroundColor: "#f3f3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {imageUrl ? (
                <img src={imageUrl} alt={productName} style={{ maxWidth: "100%", maxHeight: "100%" }} />
              ) : (
                <Skeleton height={220} />
              )}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{productName}</div>
              <div style={{ color: "#666", marginTop: 6 }}>{price ? `₹${price}` : ""}</div>
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

/**
 * Modal content that performs the two-API-call flow:
 * 1) Python AI API to get recommended product ids
 * 2) Node Main API to fetch product details by ids
 */
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
        // Call 1: Python AI API
        const resp1 = await fetch(`http://localhost:5000/api/style-builder/${encodeURIComponent(baseProductId)}`);
        if (!resp1.ok) {
          throw new Error(`AI API returned ${resp1.status}`);
        }
        const recs = await resp1.json(); // expected: [{id: "...", score: 0.9}, ...]
        const ids = (recs || []).map((r: any) => r.id).filter(Boolean);
        if (ids.length === 0) {
          if (!cancelled) {
            setRecommendedProducts([]);
            setIsLoading(false);
          }
          return;
        }

        // Call 2: Node Main API to fetch product details
        const idsParam = ids.map(encodeURIComponent).join(",");
        const resp2 = await fetch(`http://localhost:8080/api/products-by-ids?ids=${idsParam}`);
        if (!resp2.ok) {
          throw new Error(`Main API returned ${resp2.status}`);
        }
        const products = await resp2.json();
        if (!cancelled) {
          setRecommendedProducts(products || []);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to load recommendations", err);
        if (!cancelled) {
          setError(String(err));
          setIsLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [baseProductId]);

  return (
    <div style={{ padding: 16, minWidth: 320 }}>
      <h3>AI Style Suggestions</h3>
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton height={140} />
              <Skeleton height={16} style={{ marginTop: 8 }} />
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
                <div style={{ width: "100%", height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.productName} style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <Skeleton height={140} />}
                </div>
                <div style={{ marginTop: 8, fontWeight: 600 }}>{p.productName}</div>
                <div style={{ marginTop: 4, color: "#666" }}>{p.price ? `₹${p.price}` : ""}</div>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
