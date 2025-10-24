import { useState, useEffect } from "react";
import { Card, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wand2 } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: string;
  image?: string;
  productId: string;
}

interface Product {
  _id: string;
  productName: string;
  price: string;
  imageUrl?: string;
  productUrl?: string;
  source?: string;
}

interface Recommendation {
  id: string;
  score: number;
}

// AI Style Builder Modal Content Component
const AIStyleBuilderModalContent = ({ baseProductId }: { baseProductId: string }) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Get AI recommendations from Python API
        const aiResponse = await fetch(`http://localhost:5000/api/style-builder/${baseProductId}`);
        
        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.statusText}`);
        }

        const aiData = await aiResponse.json();
        const recommendedIds: Recommendation[] = aiData.recommendations || [];

        if (recommendedIds.length === 0) {
          setRecommendations([]);
          setIsLoading(false);
          return;
        }

        // Step 2: Get full product details from Node.js API
        const ids = recommendedIds.map(r => r.id).join(',');
        const productsResponse = await fetch(`http://localhost:8080/api/products-by-ids?ids=${ids}`);
        
        if (!productsResponse.ok) {
          throw new Error(`Products API error: ${productsResponse.statusText}`);
        }

        const productsData: Product[] = await productsResponse.json();
        setRecommendations(productsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        console.error('Error fetching recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [baseProductId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error}</p>
        <p className="text-muted-foreground text-sm mt-2">
          Make sure your Python AI API (port 5000) and Node.js API (port 8080) are running.
        </p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No matching items found for this product.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {recommendations.map((product) => (
        <a
          key={product._id}
          href={product.productUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-muted flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="text-muted-foreground text-sm">No Image</div>
              )}
            </div>
            <div className="p-3">
              <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.productName}</h4>
              <p className="text-brand-scout font-bold">{product.price}</p>
              {product.source && (
                <p className="text-xs text-muted-foreground mt-1">{product.source}</p>
              )}
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
};

// Main ProductCard Component
const ProductCard = ({ name, price, image, productId }: ProductCardProps) => {
  return (
    <Dialog>
      <Card className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square bg-muted flex items-center justify-center">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-muted-foreground text-sm">No Image</div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-foreground mb-2 line-clamp-2">{name}</h3>
          <p className="text-lg font-bold text-brand-scout">{price}</p>
        </div>
        <CardFooter className="pt-0 px-4 pb-4">
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Wand2 className="w-4 h-4" />
              AI Style
            </Button>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogTitle>AI Style Recommendations</DialogTitle>
        <DialogDescription>
          Items that match perfectly with <strong>{name}</strong>
        </DialogDescription>
        <AIStyleBuilderModalContent baseProductId={productId} />
      </DialogContent>
    </Dialog>
  );
};

export default ProductCard;
