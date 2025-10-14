import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SearchBar = () => {
  const [isTyping, setIsTyping] = useState(false);

  return (
    <div
      className={`w-full max-w-2xl mx-auto glass-effect rounded-full transition-smooth ${
        isTyping ? "bg-white/80" : ""
      }`}
    >
      <form className="relative flex items-center h-16 md:h-20 px-6">
        <Search className="absolute left-6 h-6 w-6 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for deals, styles, and more..."
          className="w-full h-full pl-14 pr-6 bg-transparent border-none text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
          onInput={(e) => setIsTyping((e.target as HTMLInputElement).value.trim().length > 0)}
        />
      </form>
    </div>
  );
};

export default SearchBar;
