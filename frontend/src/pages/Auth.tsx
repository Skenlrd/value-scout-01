import { useState } from "react";
import { Mail } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import PasswordInput from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Define the props interface
interface AuthProps {
  onLogin: () => void;
  initialMode?: 'login' | 'signup';
}

// Update the component signature to receive onLogin and initialMode
const Auth = ({ onLogin, initialMode = 'login' }: AuthProps) => {
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');

  // Simple submit handler to simulate authentication and call onLogin
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call success
    console.log(isSignup ? "Attempting sign up..." : "Attempting login...");
    
    // Call the function passed from App.tsx to change the global state
    // In a real app, this is where you'd check credentials.
    onLogin(); 
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 p-4 bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      <div
        className="w-full max-w-md backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl shadow-2xl p-8 transition-smooth"
        style={{ minHeight: isSignup ? "580px" : "500px" }} 
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">
            {isSignup ? "Create Account" : "Welcome Back!"}
          </h2>
          <p className="text-gray-600 text-sm">
            {isSignup
              ? "Join ValueScout and shop smarter today."
              : "Sign in to continue your style journey."}
          </p>
        </div>

        {/* Use the new handleSubmit */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="email"
              placeholder="Email"
              required
              className="pl-12 bg-white/40 border border-white/30 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-400 focus:border-transparent rounded-xl"
            />
          </div>

          <PasswordInput placeholder="Password" required />

          {isSignup && <PasswordInput placeholder="Confirm Password" required />}

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-xl font-semibold text-lg">
            {isSignup ? "Create Account" : "Login"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-700">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="font-bold text-teal-600 hover:text-teal-700 transition-colors"
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="border-b w-1/5 lg:w-1/4 border-white/40"></span>
          <p className="text-xs text-center text-gray-600 uppercase tracking-wider">Or sign in with</p>
          <span className="border-b w-1/5 lg:w-1/4 border-white/40"></span>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button type="button" className="w-12 h-12 bg-white/50 hover:bg-white/70 rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/40">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google"
              className="w-6 h-6"
            />
          </button>
          <button type="button" className="w-12 h-12 bg-white/50 hover:bg-white/70 rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/40">
            {/* Apple Logo SVG */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-900">
              <path d="M17.05 13.5c-.91 0-1.82.55-2.25 1.51.93.64 1.5 1.62 1.5 2.74 0 1.68-1.25 3.09-2.88 3.09-1.11 0-2.05-.67-2.35-1.64H9.04c.3.97 1.24 1.64 2.35 1.64 1.63 0 2.88-1.41 2.88-3.09 0-1.12-.57-2.1-1.5-2.74.43-.96 1.34-1.51 2.25-1.51 1.66 0 3 1.34 3 3 0 1.66-1.34 3-3 3zm-8.05-2.5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm0-5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8.05 2.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;