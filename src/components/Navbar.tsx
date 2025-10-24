import { useState } from "react";
// Import the 'Sparkles' icon
import { Menu, Star, User, ShoppingBag, Sparkles } from "lucide-react";
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
    { label: "AI STYLE BUILDER", href: "/style-builder" },
    { label: "SEARCH BY CATEGORY", href: "#category" },
  ];

  return (
    <nav className="border-b border-border">
      <div className="container mx-auto px-4">
        {/* Using grid for perfect centering of text */}
        <div className="grid grid-cols-3 items-center h-16">
          
          {/* Hamburger Menu (Left Aligned) */}
          <div className="justify-self-start">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" /> {/* Kept at h-6 w-6 */}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm font-medium hover:text-brand-scout transition-colors flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label === "AI STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                      {link.label}
                    </a>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center Navigation (Center Aligned) */}
          <div className="hidden lg:flex items-center justify-self-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium hover:text-brand-scout transition-colors whitespace-nowrap flex items-center gap-2"
              >
                {/* AI icon size */}
                {link.label === "AI STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Icons (Right Aligned) - Increased size to h-6 w-6 */}
          <div className="flex items-center gap-4 justify-self-end">
            <Button variant="ghost" size="icon" className="text-foreground hover:text-brand-scout">
              <Star className="h-6 w-6" /> {/* Changed from h-5 w-5 */}
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground hover:text-brand-scout">
              <User className="h-6 w-6" /> {/* Changed from h-5 w-5 */}
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground hover:text-brand-scout">
              <ShoppingBag className="h-6 w-6" /> {/* Changed from h-5 w-5 */}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;