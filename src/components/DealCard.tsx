import { Card } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";

interface DealCardProps {
  name: string;
  currentPrice: string;
  priceDrop: string;
  image?: string;
}

const DealCard = ({ name, currentPrice, priceDrop, image }: DealCardProps) => {
  return (
    <Card className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-muted-foreground text-sm">No Image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground mb-2 line-clamp-2">{name}</h3>
        <p className="text-lg font-bold text-brand-scout mb-1">{currentPrice}</p>
        <div className="flex items-center gap-1 text-green-600">
          <ArrowDown className="w-4 h-4" />
          <span className="text-sm font-medium">{priceDrop}</span>
        </div>
      </div>
    </Card>
  );
};

export default DealCard;
