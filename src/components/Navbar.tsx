import { useState } from "react";
import { Menu, Star, User, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: "COMPARE DEALS", href: "/compare" },
    { label: "AI STYLE BUILDER", href: "#style" },
    { label: "SEARCH BY CATEGORY", href: "#category" },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Hamburger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium hover:text-brand-scout transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Center Navigation (Desktop) */}
          <div className="hidden lg:flex items-center justify-center flex-1 gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium hover:text-brand-scout transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-foreground hover:text-brand-scout">
              <Star className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground hover:text-brand-scout">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground hover:text-brand-scout">
              <ShoppingBag className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
