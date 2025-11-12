import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface WishlistCardProps {
  name: string;
  image?: string;
  currentPrice: string;
  priceChange: string;
  isIncrease?: boolean;
  details?: string;
}

const WishlistCard = ({ 
  name, 
  image, 
  currentPrice, 
  priceChange, 
  isIncrease = false,
  details 
}: WishlistCardProps) => {
  return (
    <Card className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow min-w-[280px]">
      <div className="flex gap-4 p-4">
        <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-muted-foreground text-xs">No Image</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1 line-clamp-2">{name}</h3>
          {details && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{details}</p>
          )}
          <p className="text-lg font-bold text-brand-scout mb-1">{currentPrice}</p>
          <div className={`flex items-center gap-1 ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
            {isIncrease ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{priceChange}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WishlistCard;
