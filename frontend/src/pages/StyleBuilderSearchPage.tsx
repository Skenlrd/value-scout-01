import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton";

interface Product {
  _id: string;
  productName: string;
  brand?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  productUrl?: string;
  source?: string;
}

const StyleBuilderPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const resp = await fetch(
        `http://localhost:8080/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await resp.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      <div className="px-6 sm:px-10 md:px-16 lg:px-24 py-10">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-3">
            AI Style Builder
          </h1>

          <p className="text-gray-700 mb-8 text-sm md:text-base">
            Search clothing and footwear, then tap the AI icon on any product to
            generate matching outfit ideas.
          </p>

        <div className="max-w-2xl mx-auto mb-10">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* LOADING SKELETON */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          // RESULTS GRID
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
            {results.map((product) => (
              <ProductCard
                key={product._id}
                productId={product._id}
                productName={product.productName}
                price={product.price}
                imageUrl={product.imageUrl}
                productUrl={product.productUrl}
                source={product.source}
              />
            ))}
          </div>
        ) : (
          // NO RESULTS FOUND
          query && (
            <div className="mt-10 text-gray-600 text-sm md:text-base">
              No results found. Try a different search.
            </div>
          )
        )}
        </div>
      </div>
    </div>
  );
};

export default StyleBuilderPage;
