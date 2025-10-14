import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps = {}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsTyping(value.trim().length > 0);
    onSearch?.(value);
  };

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
          value={query}
          onChange={handleChange}
        />
      </form>
    </div>
  );
};

export default SearchBar;
