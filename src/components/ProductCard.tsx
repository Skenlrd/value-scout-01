import { Card } from "@/components/ui/card";

interface ProductCardProps {
  name: string;
  price: string;
  image?: string;
}

const ProductCard = ({ name, price, image }: ProductCardProps) => {
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
        <p className="text-lg font-bold text-brand-scout">{price}</p>
      </div>
    </Card>
  );
};

export default ProductCard;
