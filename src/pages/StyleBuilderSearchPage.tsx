import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { Skeleton } from "../components/ui/skeleton"; // adjust path if your project uses a different Skeleton component

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

const StyleBuilderSearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q || q.trim().length === 0) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const encoded = encodeURIComponent(q);
      const resp = await fetch(`http://localhost:8080/api/search?q=${encoded}`);
      const json = await resp.json();
      setResults(json || []);
    } catch (err) {
      console.error("Search failed", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>AI Style Builder</h1>
      <p>Search our catalog for clothing and sneakers, then use the AI icon on any product to build outfits.</p>

      <SearchBar onSearch={handleSearch} />

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton height={220} />
              <Skeleton height={20} style={{ marginTop: 8 }} />
              <Skeleton height={16} style={{ marginTop: 6 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
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
      )}
    </div>
  );
};

export default StyleBuilderSearchPage;
