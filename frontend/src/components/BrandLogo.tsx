import { useNavigate } from "react-router-dom";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const BrandLogo = ({ size = "md", className = "" }: BrandLogoProps) => {
  const navigate = useNavigate();
  
  const sizeClasses = {
    sm: "text-xl md:text-2xl",
    md: "text-2xl md:text-3xl",
    lg: "text-3xl md:text-4xl"
  };

  return (
    <button
      onClick={() => navigate("/")}
      className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
    >
      <h1 className={`font-pixel ${sizeClasses[size]} ${className}`}>
        <span className="text-brand-value">Value</span>
        <span className="text-brand-scout">Scout</span>
      </h1>
    </button>
  );
};

export default BrandLogo;
