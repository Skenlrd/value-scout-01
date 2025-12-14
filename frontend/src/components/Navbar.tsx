import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
// Import the 'Sparkles' icon
import { Menu, User, Sparkles, Star, LogOut, ChevronDown } from "lucide-react";
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
  const profileRef = useRef<HTMLDivElement>(null);
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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileOpen]);

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
    { label: "STYLE BUILDER", href: "/style-builder" },
    { label: "WISHLIST", href: "/wishlist" },
  ];

  return (
    <nav className="bg-transparent">
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
                        {link.label === "STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label === "STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
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
                  className="text-base font-semibold text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  {/* Icon size */}
                  {link.label === "STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                  {link.label === "WISHLIST" && <Star className="h-5 w-5 text-black" />}
                  {link.label === "WISHLIST" ? "WISHLIST / PRICE TRACKER" : link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-base font-semibold text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  {link.label === "STYLE BUILDER" && <Sparkles className="h-5 w-5" />}
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Right Icons (Right Aligned) - Increased size to h-6 w-6 */}
          <div className="flex items-center gap-4 justify-self-end relative" ref={profileRef}>
            {/* Profile Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-700 hover:text-gray-900 relative group"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <User className="h-6 w-6" />
                {isProfileOpen && (
                  <ChevronDown className="absolute h-3 w-3 bottom-0 right-0 text-brand-scout animate-bounce" />
                )}
              </Button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 bg-white/95 backdrop-blur-md border border-gray-300 rounded-2xl shadow-2xl z-50 min-w-[300px] overflow-hidden">
                  {isAuthenticated ? (
                    <div className="py-0">
                      {/* User Info Section */}
                      <div className="px-5 py-5 border-b border-gray-200 bg-gradient-to-r from-brand-scout/15 to-transparent">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-brand-scout/25 backdrop-blur-sm flex items-center justify-center border-2 border-brand-scout/40">
                            <User className="h-6 w-6 text-brand-scout" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-700 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-100/80 transition-all duration-200 flex items-center gap-3 group border-t border-gray-200"
                      >
                        <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform text-red-600" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 px-5 py-5">
                      <button
                        onClick={() => {
                          navigate("/login");
                          setIsProfileOpen(false);
                        }}
                        className="flex-1 text-center px-4 py-2.5 text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all duration-200 border border-gray-300 shadow-sm hover:shadow-md"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          navigate("/register");
                          setIsProfileOpen(false);
                        }}
                        className="flex-1 text-center px-4 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
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