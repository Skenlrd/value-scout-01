import { useState } from "react";
import { Helmet } from "react-helmet";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { Wand2 } from "lucide-react";

interface Product {
  _id: string;
  productName: string;
  price: string;
  imageUrl?: string;
  productUrl?: string;
  source: string;
  brand?: string;
}

const StyleBuilderSearchPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasSearched(true);

      const response = await fetch(`http://localhost:8080/api/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.statusText}`);
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err) {
      console.error('Error searching products:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Style Builder - ValueScout</title>
        <meta name="description" content="Search for clothing and sneakers, get AI-powered style recommendations" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Wand2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              AI Style Builder
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search for your favorite Nike and Adidas products from top retailers. 
              Get AI-powered outfit recommendations instantly.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && hasSearched && products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No products found. Try searching for "Nike", "Adidas", or "shoes".
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Make sure your Node.js API (port 8080) is running.
              </p>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && products.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  {products.length} {products.length === 1 ? 'Result' : 'Results'}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    productId={product._id}
                    name={product.productName}
                    price={product.price}
                    image={product.imageUrl}
                    productUrl={product.productUrl}
                    source={product.source}
                  />
                ))}
              </div>
            </>
          )}

          {/* Initial State */}
          {!hasSearched && !isLoading && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Start by searching for Nike, Adidas, shoes, or any clothing item
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default StyleBuilderSearchPage;
