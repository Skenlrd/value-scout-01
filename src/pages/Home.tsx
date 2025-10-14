import BrandLogo from "@/components/BrandLogo";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import heroImage from "@/assets/hero-image.jpg";

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
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            filter: "brightness(0.8)",
          }}
        />
        
        {/* Search Overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <SearchBar />
        </div>
      </section>

      {/* Content sections would go here */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Discover Your Perfect Style</h2>
          <p className="text-muted-foreground text-lg">
            Compare deals, build your AI-powered wardrobe, and shop smarter with ValueScout.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
