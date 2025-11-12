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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <BrandLogo size="lg" />
      </div>

      <div
        className="w-full max-w-md glass-effect rounded-2xl shadow-2xl p-8 transition-smooth"
        // Adjust minHeight to fit content responsively
        style={{ minHeight: isSignup ? "560px" : "480px" }} 
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {isSignup ? "Create Account" : "Welcome Back!"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isSignup
              ? "Join ValueScout and shop smarter today."
              : "Sign in to continue your style journey."}
          </p>
        </div>

        {/* Use the new handleSubmit */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email"
              required
              className="pl-10 bg-white/60 border-transparent focus:ring-2 focus:ring-primary rounded-lg"
            />
          </div>

          <PasswordInput placeholder="Password" required />

          {isSignup && <PasswordInput placeholder="Confirm Password" required />}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 rounded-lg">
            {isSignup ? "Create Account" : "Login"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button" // Use type="button" to prevent form submission when clicking
              onClick={() => setIsSignup(!isSignup)}
              className="font-bold text-foreground hover:text-brand-scout transition-colors"
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="border-b w-1/5 lg:w-1/4 border-border"></span>
          <p className="text-xs text-center text-muted-foreground uppercase">Or sign in with</p>
          <span className="border-b w-1/5 lg:w-1/4 border-border"></span>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button type="button" className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center hover:bg-white/80 transition-smooth p-2.5">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google"
              className="w-full h-full"
            />
          </button>
          <button type="button" className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center hover:bg-white/80 transition-smooth">
            {/* Apple Logo SVG - I replaced the generic SVG with a proper Apple logo path for clarity */}
            <svg viewBox="0 0 1000 1000" role="img" fill="currentColor" className="w-6 h-6">
                <path d="M789.7 542.4c-12.2-22.1-33.1-41-47.8-63.5-12.7-19.5-27.1-40.4-30-63.7-2.6-20.1 7.2-40.6 20.8-55.6 15.6-18.4 35.8-31.4 38.3-55.5-2.2-13.8-13.6-29.3-26.6-40.7-11.8-10.4-25.1-18.3-39-25.7-17.6-9.1-35.3-17.1-57.8-16.1-28.7 1.4-53 18.2-70.3 35.5-14.8 14.8-29.4 30.2-47.5 40.5-22.4 12.8-48.4 11.2-70.8 2.6-17.9-6.9-34.9-19.1-49.8-31.9-18.1-15.6-35.1-32.9-60.1-35.4-23.8-2.3-46.7 8.3-64.8 25.4-17.7 16.4-32.5 35.8-43.2 57.3-13.7 27.2-21.7 56.5-18.1 87.5 4.5 39.1 27.6 74.3 49.3 103.8 21.6 29.3 43.1 58.7 66.8 85.5 17 19.3 36.6 37.5 59.9 51.5 28 17.1 57.2 27.3 90.7 28.5 29.7 1 59.1-8.2 84.7-23.7 11.4-6.9 22.3-14.9 31.8-25.4 16.3-18 29.8-38.3 40.9-60.6 10.1-19.9 21.6-40.8 33.6-61.9 14.7-25.6 31.1-50.6 35.7-77.7zm-265.4-448c26.7 1.9 50.4 18.2 60 41.7 8.8 21-1.6 42.8-18.6 57.3-17.1 14.4-37.4 21.7-60.1 18-20.7-3.4-39.6-18.1-47.2-39.7-7.8-22.3 2.9-46 22.1-60.7 15.6-11.9 35-18.4 43.8-16.6z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;