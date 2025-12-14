import { Card } from "@/components/ui/card";
import { ArrowDown, Heart, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface DealCardProps {
  name: string;
  currentPrice: string;
  priceDrop: string;
  image?: string;
  link?: string;
  source?: string;
  asin?: string;
  onWishlistToggle?: (product: any) => void;
  isInWishlist?: boolean;
}

const DealCard = ({ 
  name, currentPrice, priceDrop, image, link, source, asin, onWishlistToggle, isInWishlist 
}: DealCardProps) => {
  const [hovered, setHovered] = useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle({
        asin,
        title: name,
        price: currentPrice,
        source: source,
        link: link,
        image: image
      });
    }
  };

  return (
    <a 
      href={link || "#"} 
      target="_blank" 
      rel="noreferrer"
      className="no-underline block group"
      onClick={(e) => {
        if (!link) {
          e.preventDefault();
        }
      }}
    >
      <Card 
        className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all h-full flex flex-col cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image Section */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform">
          {image ? (
            <img 
              src={image} 
              alt={name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-muted-foreground text-sm">No Image</div>
          )}
          
          {/* Overlay with quick action buttons */}
          {hovered && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
              {link && (
                <Button 
                  size="sm"
                  className="bg-white/90 hover:bg-white text-black"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(link, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              )}
              <Button 
                size="sm"
                className={`${isInWishlist ? 'bg-red-500 hover:bg-red-600' : 'bg-white/90 hover:bg-white'}`}
                onClick={handleWishlistClick}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-white' : 'text-red-500'}`} />
              </Button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-medium text-foreground text-base mb-2 line-clamp-2 group-hover:text-gray-700">{name}</h3>
          <p className="text-xl font-bold text-black mb-2">{currentPrice}</p>
          <div className="flex items-center gap-1 text-green-600 mt-auto">
            <ArrowDown className="w-4 h-4" />
            <span className="text-sm font-medium">{priceDrop}</span>
          </div>
          {source && <span className="text-sm text-gray-500 mt-2">{source}</span>}
        </div>
      </Card>
    </a>
  );
};

export default DealCard;
