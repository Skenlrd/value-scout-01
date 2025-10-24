import { useState } from "react";
import BrandLogo from "@/components/BrandLogo"; // cite: 36
import Navbar from "@/components/Navbar"; // cite: 37
import SearchBar from "@/components/SearchBar"; // cite: 38
import ComparisonProductCard from "@/components/ComparisonProductCard"; // cite: 39
import { Button } from "@/components/ui/button"; // cite: 40

const Compare = () => {
  const [searchQuery, setSearchQuery] = useState(""); // cite: 34
  const [showResults, setShowResults] = useState(false); // cite: 34

  const handleSearch = (query: string) => { // cite: 34
    setSearchQuery(query); // cite: 34
    setShowResults(query.length > 0); // cite: 34
  };

  // Mock comparison data // cite: 34
  const comparisonResults = [ // cite: 34
    { // cite: 34
      storeName: "Nike", // cite: 34
      price: "₹10,795", // cite: 34
      rating: 4.5, // cite: 34
      deliveryDate: "12 Jul", // cite: 34
    },
    { // cite: 34
      storeName: "Myntra", // cite: 34
      price: "₹8,995", // cite: 34
      rating: 4.8, // cite: 34
      deliveryDate: "9 Jul", // cite: 34
      isHighlighted: true, // cite: 34
    },
    { // cite: 34
      storeName: "Adidas", // cite: 34
      price: "₹8,995", // cite: 34
      rating: 4.3, // cite: 34
      deliveryDate: "10 Jul", // cite: 34
    },
  ];

  return (
    // Make sure this uses the global background variable // cite: 34
    <div className="min-h-screen bg-background"> {/* cite: 34 */}
      {/* Brand Header */} {/* cite: 34 */}
      <header className="text-center py-6"> {/* cite: 34 */}
        <BrandLogo size="md" /> {/* cite: 34 */}
      </header>

      {/* Navigation */} {/* cite: 34 */}
      <Navbar /> {/* cite: 34 */}

      {/* Hero Section with Search - Removed the gradient classes */} {/* cite: 34 */}
      <section className="relative py-20"> {/* cite: 34 */}
        <div className="container mx-auto px-4"> {/* cite: 34 */}
          <div className="max-w-3xl mx-auto text-center mb-8"> {/* cite: 34 */}
            <h1 className="text-4xl font-bold mb-4">Compare Deals</h1> {/* cite: 34 */}
            <p className="text-muted-foreground text-lg mb-8"> {/* cite: 34 */}
              Search for any product and find the best prices across multiple stores {/* cite: 34 */}
            </p>
            <SearchBar onSearch={handleSearch} /> {/* cite: 34 */}
          </div>
        </div>
      </section>

      {/* Search Results */} {/* cite: 34 */}
      {showResults && ( // cite: 34
        <section className="container mx-auto px-4 py-16"> {/* cite: 34 */}
          <div className="bg-card rounded-lg p-6 mb-8 text-center"> {/* cite: 34 */}
            <h2 className="text-xl font-semibold mb-2"> {/* cite: 34 */}
              Jordan 1 Low: Here's how they're priced right now {/* cite: 34 */}
            </h2>
            <p className="text-muted-foreground"> {/* cite: 34 */}
              Showing best prices from trusted retailers {/* cite: 34 */}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12"> {/* cite: 34 */}
            {comparisonResults.map((result, index) => ( // cite: 34
              <ComparisonProductCard key={index} {...result} /> // cite: 34
            ))}
          </div>

          {/* Popular Comparisons */} {/* cite: 34 */}
          <section className="mt-16"> {/* cite: 34 */}
            <h2 className="text-2xl font-bold mb-6">Popular Product Comparisons</h2> {/* cite: 34 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* cite: 34 */}
              {/* Comparison Group 1 */} {/* cite: 34 */}
              <div className="bg-card border border-border rounded-lg p-6"> {/* cite: 34 */}
                <div className="flex items-center justify-between mb-4"> {/* cite: 34 */}
                  <div className="flex items-center gap-2"> {/* cite: 34 */}
                    <div className="w-12 h-12 bg-muted rounded-lg"></div> {/* cite: 34 */}
                    <span className="font-medium">vs</span> {/* cite: 34 */}
                    <div className="w-12 h-12 bg-muted rounded-lg"></div> {/* cite: 34 */}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Xiaomi Redmi Note 10 vs Xiaomi Redmi Note 10 Pro</h3> {/* cite: 34 */}
                <p className="text-sm text-muted-foreground mb-4">₹13,890 vs ₹15,890</p> {/* cite: 34 */}
                <Button variant="outline" className="w-full">Compare</Button> {/* cite: 34 */}
              </div>

              {/* Comparison Group 2 */} {/* cite: 34 */}
              <div className="bg-card border border-border rounded-lg p-6"> {/* cite: 34 */}
                <div className="flex items-center justify-between mb-4"> {/* cite: 34 */}
                  <div className="flex items-center gap-2"> {/* cite: 34 */}
                    <div className="w-12 h-12 bg-muted rounded-lg"></div> {/* cite: 34 */}
                    <span className="font-medium">vs</span> {/* cite: 34 */}
                    <div className="w-12 h-12 bg-muted rounded-lg"></div> {/* cite: 34 */}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Samsung Galaxy F12 vs Samsung Galaxy M12</h3> {/* cite: 34 */}
                <p className="text-sm text-muted-foreground mb-4">₹10,499 vs ₹10,345</p> {/* cite: 34 */}
                <Button variant="outline" className="w-full">Compare</Button> {/* cite: 34 */}
              </div>

              {/* Comparison Group 3 */} {/* cite: 34 */}
              <div className="bg-card border border-border rounded-lg p-6"> {/* cite: 34 */}
                <div className="flex items-center justify-between mb-4"> {/* cite: 34 */}
                  <div className="flex items-center gap-2"> {/* cite: 34 */}
                    <div className="w-12 h-12 bg-muted rounded-lg"></div> {/* cite: 34 */}
                    <span className="font-medium">vs</span> {/* cite: 34 */}
                    <div className="w-12 h-12 bg-muted rounded-lg"></div> {/* cite: 34 */}
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Xiaomi Redmi Note 10 vs Realme 8</h3> {/* cite: 34 */}
                <p className="text-sm text-muted-foreground mb-4">₹13,890 vs ₹15,999</p> {/* cite: 34 */}
                <Button variant="outline" className="w-full">Compare</Button> {/* cite: 34 */}
              </div>
            </div>
          </section>
        </section>
      )}

      {/* Empty State */} {/* cite: 34 */}
      {!showResults && ( // cite: 34
        <section className="container mx-auto px-4 py-16"> {/* cite: 34 */}
          <div className="text-center max-w-2xl mx-auto"> {/* cite: 34 */}
            <h2 className="text-2xl font-bold mb-4">Start Comparing Products</h2> {/* cite: 34 */}
            <p className="text-muted-foreground"> {/* cite: 34 */}
              Use the search bar above to find products and compare prices across different retailers. {/* cite: 34 */}
              Get the best deals and make informed purchasing decisions. {/* cite: 34 */}
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Compare; // cite: 34