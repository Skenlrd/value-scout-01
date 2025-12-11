import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// Import the 'Sparkles' icon
import { Menu, User, Sparkles, Star, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import useAuth from "@/hooks/useAuth";

type NavbarProps = {
  onLogout?: () => void;
  isLoggedIn?: boolean;
};

const Navbar = ({ onLogout }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const authHook = useAuth();
  const [user, setUser] = useState(authHook.user);
  const [isAuthenticated, setIsAuthenticated] = useState(authHook.isAuthenticated);

  // Listen for storage changes (e.g., when Google OAuth stores user in localStorage)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("valuescout_user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Failed to parse stored user:", e);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    // Listen to storage changes from other tabs/windows
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for a custom event when localStorage changes in same tab
    window.addEventListener("valueScoutAuthChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("valueScoutAuthChange", handleStorageChange);
    };
  }, []);

  // Also sync when authHook updates
  useEffect(() => {
    setUser(authHook.user);
    setIsAuthenticated(authHook.isAuthenticated);
  }, [authHook.user, authHook.isAuthenticated]);

  const logout = () => {
    authHook.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleLogout = () => {
    authHook.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIsProfileOpen(false);
    if (onLogout) {
      onLogout();
    }
    navigate("/");
  };

  const navLinks = [
    { label: "COMPARE DEALS", href: "/compare" },
    { label: "AI STYLE BUILDER", href: "/style-builder" },
    { label: "WISHLIST", href: "/wishlist" },
  ];

  return (
    <nav className="bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3] shadow-sm">
      <div className="container mx-auto px-4">
        {/* Using grid for perfect centering of text */}
        <div className="grid grid-cols-3 items-center h-16">
          
          {/* Hamburger Menu (Left Aligned) */}
          <div className="justify-self-start">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    link.href.startsWith("/") ? (
                      <Link
                        key={link.label}
                        to={link.href}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label === "AI STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label === "AI STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                        {link.label}
                      </a>
                    )
                  ))}
                  
                  {/* Login / Register Divider */}
                  <div className="my-4 border-t border-gray-300"></div>
                  
                  {/* Login / Register One Line */}
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      className="flex-1 text-center text-sm font-medium text-gray-700 hover:text-brand-scout transition-colors py-2 border border-gray-300 rounded hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 text-center text-sm font-medium text-gray-700 hover:text-brand-scout transition-colors py-2 border border-gray-300 rounded hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center Navigation (Center Aligned) */}
          <div className="hidden lg:flex items-center justify-self-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  {/* AI icon size */}
                  {link.label === "AI STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                  {link.label === "WISHLIST" && <Star className="h-5 w-5 text-black" />}
                  {link.label === "WISHLIST" ? "WISHLIST / PRICE TRACKER" : link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  {link.label === "AI STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Right Icons (Right Aligned) - Increased size to h-6 w-6 */}
          <div className="flex items-center gap-4 justify-self-end relative">
            {/* Profile Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:text-gray-900"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <User className="h-6 w-6" />
              </Button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                  {isAuthenticated ? (
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="flex px-2 py-2">
                      <button
                        onClick={() => {
                          navigate("/login");
                          setIsProfileOpen(false);
                        }}
                        className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-scout transition-colors"
                      >
                        Login
                      </button>
                      <span className="text-gray-300">/</span>
                      <button
                        onClick={() => {
                          navigate("/register");
                          setIsProfileOpen(false);
                        }}
                        className="flex-1 text-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-scout transition-colors"
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;