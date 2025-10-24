import BrandLogo from "../components/BrandLogo";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import DealCard from "../components/DealCard";
import WishlistCard from "../components/WishlistCard";
// Import the video file
import heroVideo from "../assets/video1.mp4";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Brand Header */}
      <header className="text-center py-6">
        <BrandLogo size="md" />
      </header>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section with Search */}
      <section className="relative h-[60vh] max-h-[500px] overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ filter: "brightness(0.8)" }}
        >
          {/* Use the imported video variable here */}
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Search Overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
          <SearchBar />
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Discover Your Perfect Style</h2>
          <p className="text-muted-foreground text-lg">
            Compare deals, build your AI-powered wardrobe, and shop smarter with
            ValueScout.
          </p> {/* Corrected closing tag */}
        </div>

        {/* Top Trending Deals Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Top Trending Deals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard name="Premium Wireless Headphones" price="$299" productId="myntra_123456" source="Myntra" />
            <ProductCard name="Smart Watch Pro" price="$399" productId="myntra_789012" source="Superkicks" />
            <ProductCard name="Designer Sunglasses" price="$159" productId="myntra_345678" source="VegNonVeg" />
            <ProductCard name="Leather Backpack" price="$129" productId="myntra_456789" source="Myntra" />
          </div>
        </section>

        {/* Lowest This Month Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Lowest This Month</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DealCard
              name="Running Shoes Elite"
              currentPrice="$89"
              priceDrop="$40 off"
            />
            <DealCard
              name="Casual Denim Jacket"
              currentPrice="$59"
              priceDrop="$30 off"
            />
            <DealCard
              name="Fitness Tracker Band"
              currentPrice="$45"
              priceDrop="$25 off"
            />
            <DealCard
              name="Winter Coat Premium"
              currentPrice="$119"
              priceDrop="$50 off"
            />
          </div>
        </section>

        {/* Wishlist Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            Your Wishlist - Price Alerts
          </h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4">
              <WishlistCard
                name="Premium Sneakers"
                currentPrice="$149"
                priceChange="$20 down (last 3 days)"
                details="Available in 5 colors"
              />
              <WishlistCard
                name="Wireless Earbuds Pro"
                currentPrice="$199"
                priceChange="$15 down (last 3 days)"
                details="Noise cancellation feature"
              />
              <WishlistCard
                name="Designer Watch"
                currentPrice="$599"
                priceChange="$30 up (last 3 days)"
                isIncrease={true}
                details="Limited edition"
              />
              <WishlistCard
                name="Yoga Mat Premium"
                currentPrice="$49"
                priceChange="$10 down (last 3 days)"
                details="Eco-friendly material"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;

