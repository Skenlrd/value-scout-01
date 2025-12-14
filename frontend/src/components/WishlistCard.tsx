import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WishlistCardProps {
  name: string;
  image?: string;
  currentPrice: string;
  priceChange: string;
  isIncrease?: boolean;
  details?: string;
  targetPrice?: string | number;
}

const WishlistCard = ({ 
  name, 
  image, 
  currentPrice, 
  priceChange, 
  isIncrease = false,
  details,
  targetPrice
}: WishlistCardProps) => {
  const hasAlert = targetPrice && targetPrice !== 0;
  const alertPrice = typeof targetPrice === 'string' ? targetPrice : (targetPrice ? `₹${targetPrice}` : null);
  
  return (
    <Card className={`bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow min-w-[320px] flex flex-col ${hasAlert ? 'border-amber-300 bg-amber-50/50' : 'border-border'}`}>
      <div className="relative w-full h-48 bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-muted-foreground text-sm">No Image</div>
        )}
        {hasAlert && (
          <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1">
            <BellRing className="w-3 h-3" />
            Alert Set
          </Badge>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-foreground mb-2 line-clamp-2 text-base">{name}</h3>
        {details && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{details}</p>
        )}
        <p className="text-xl font-bold text-brand-scout mb-2">{currentPrice}</p>
        {hasAlert && (
          <p className="text-xs text-amber-700 font-semibold mb-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-600"></span>
            Alert below {alertPrice}
          </p>
        )}
        <div className={`flex items-center gap-1 ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
          {isIncrease ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{priceChange}</span>
        </div>
      </div>
    </Card>
  );
};

export default WishlistCard;
