import { useState } from "react";
import { Mail } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import PasswordInput from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Auth = () => {
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <BrandLogo size="lg" />
      </div>

      <div
        className="w-full max-w-md glass-effect rounded-2xl shadow-2xl p-8 transition-smooth"
        style={{ minHeight: isSignup ? "600px" : "520px" }}
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

        <form className="space-y-6">
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
          <button className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center hover:bg-white/80 transition-smooth p-2.5">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google"
              className="w-full h-full"
            />
          </button>
          <button className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center hover:bg-white/80 transition-smooth">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
