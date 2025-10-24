import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import ComparisonProductCard from "@/components/ComparisonProductCard";
import { Button } from "@/components/ui/button";

const Compare = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.length > 0);
  };

  // Mock comparison data
  const comparisonResults = [
    {
      storeName: "Nike",
      price: "₹10,795",
      rating: 4.5,
      deliveryDate: "12 Jul",
    },
    {
      storeName: "Myntra",
      price: "₹8,995",
      rating: 4.8,
      deliveryDate: "9 Jul",
      isHighlighted: true,
    },
    {
      storeName: "Adidas",
      price: "₹8,995",
      rating: 4.3,
      deliveryDate: "10 Jul",
    },
  ];

  return (
    // Updated this div to use the gradient background from index.css
    <div className="min-h-screen bg-background" style={{ backgroundImage: 'var(--gradient-bg)' }}> {/* Changed background */}
      {/* Brand Header */}
      <header className="text-center py-6">
        <BrandLogo size="md" />
      </header>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section with Search - Removed the gradient classes */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Compare Deals</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Search for any product and find the best prices across multiple stores
            </p>
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Search Results */}
      {showResults && (
        <section className="container mx-auto px-4 py-16">
          <div className="bg-card rounded-lg p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Jordan 1 Low: Here's how they're priced right now
            </h2>
            <p className="text-muted-foreground">
              Showing best prices from trusted retailers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {comparisonResults.map((result, index) => (
              <ComparisonProductCard key={index} {...result} />
            ))}
          </div>

          {/* Popular Comparisons */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Popular Product Comparisons</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Comparison Group 1 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <span className="font-medium">vs</span>
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Xiaomi Redmi Note 10 vs Xiaomi Redmi Note 10 Pro</h3>
                <p className="text-sm text-muted-foreground mb-4">₹13,890 vs ₹15,890</p>
                <Button variant="outline" className="w-full">Compare</Button>
              </div>

              {/* Comparison Group 2 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <span className="font-medium">vs</span>
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Samsung Galaxy F12 vs Samsung Galaxy M12</h3>
                <p className="text-sm text-muted-foreground mb-4">₹10,499 vs ₹10,345</p>
                <Button variant="outline" className="w-full">Compare</Button>
              </div>

              {/* Comparison Group 3 */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <span className="font-medium">vs</span>
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Xiaomi Redmi Note 10 vs Realme 8</h3>
                <p className="text-sm text-muted-foreground mb-4">₹13,890 vs ₹15,999</p>
                <Button variant="outline" className="w-full">Compare</Button>
              </div>
            </div>
          </section>
        </section>
      )}

      {/* Empty State */}
      {!showResults && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Start Comparing Products</h2>
            <p className="text-muted-foreground">
              Use the search bar above to find products and compare prices across different retailers.
              Get the best deals and make informed purchasing decisions.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Compare;