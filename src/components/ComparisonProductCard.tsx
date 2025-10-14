import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ComparisonProductCardProps {
  storeName: string;
  storeImage?: string;
  price: string;
  rating: number;
  deliveryDate?: string;
  isHighlighted?: boolean;
}

const ComparisonProductCard = ({ 
  storeName, 
  storeImage, 
  price, 
  rating, 
  deliveryDate,
  isHighlighted = false 
}: ComparisonProductCardProps) => {
  return (
    <Card className={`p-6 text-center transition-all ${
      isHighlighted 
        ? 'bg-foreground text-background border-2 border-foreground scale-105' 
        : 'bg-card text-foreground border border-border hover:shadow-lg'
    }`}>
      <div className="h-16 flex items-center justify-center mb-4">
        {storeImage ? (
          <img src={storeImage} alt={storeName} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className={`text-2xl font-bold ${isHighlighted ? 'text-background' : 'text-muted-foreground'}`}>
            {storeName}
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p className={`text-xs uppercase mb-1 ${isHighlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
          Price
        </p>
        <p className="text-2xl font-bold">{price}</p>
      </div>

      <div className="mb-3">
        <p className={`text-xs uppercase mb-1 ${isHighlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
          Rating
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg font-semibold">{rating}</span>
          <Star className="w-4 h-4 fill-current" />
        </div>
      </div>

      {deliveryDate && (
        <div>
          <p className={`text-xs uppercase mb-1 ${isHighlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
            Delivery by
          </p>
          <p className="font-medium">{deliveryDate}</p>
        </div>
      )}
    </Card>
  );
};

export default ComparisonProductCard;
