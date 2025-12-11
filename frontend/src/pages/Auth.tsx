import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import BrandLogo from "@/components/BrandLogo";
import PasswordInput from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuth from "@/hooks/useAuth";

// Define the props interface
interface AuthProps {
  onLogin?: () => void;
  initialMode?: 'login' | 'signup';
}

// Update the component signature to receive onLogin and initialMode
const Auth = ({ onLogin, initialMode = 'login' }: AuthProps) => {
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Submit handler with real authentication
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      if (isSignup) {
        await register(email, password, name);
        console.log("✅ Registration successful");
        setRegistrationSuccess(true);
      } else {
        await login(email, password);
        console.log("✅ Login successful");
        
        // Dispatch custom event to notify Navbar of login
        window.dispatchEvent(new Event("valueScoutAuthChange"));
        
        if (onLogin) {
          onLogin();
        }
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth handler using token to fetch profile
  const handleGoogleLogin = async (tokenResponse: any) => {
    try {
      setLoading(true);
      setError("");
      
      const profileResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      });

      if (!profileResp.ok) {
        throw new Error("Failed to fetch Google profile");
      }

      const userData = await profileResp.json();
      console.log("✅ Google profile fetched:", userData.email);

      const response = await fetch("http://localhost:8000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          googleId: userData.sub,
        }),
      });

      const data = await response.json();
      console.log("Backend response:", data);
      
      if (response.ok) {
        console.log("✅ Google login successful, storing user and logging in");
        localStorage.setItem("valuescout_user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");
        
        // Dispatch custom event to notify Navbar and other components
        window.dispatchEvent(new Event("valueScoutAuthChange"));
        
        // Call onLogin to sync parent state
        if (onLogin) {
          onLogin();
        }
        
        // Navigate after a brief delay to ensure state updates
        setTimeout(() => {
          navigate("/");
        }, 100);
      } else {
        setError(data.error || "Google login failed");
      }
    } catch (err: any) {
      console.error("❌ Google login error:", err);
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLogin,
    onError: () => setError("Google login failed"),
    scope: "openid email profile",
    prompt: "select_account",
    ux_mode: "popup",
  });

  // Apple OAuth handler
  const handleAppleLogin = async () => {
    try {
      // In production, use Apple's official SDK
      // For now, prompt for email
      const email = prompt("Enter your email for Apple login:");
      if (!email) return;

      const response = await fetch("http://localhost:8000/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          name: email.split("@")[0],
          appleId: `apple_${Date.now()}` // Placeholder
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");
        if (onLogin) onLogin();
        navigate("/");
      } else {
        setError(data.error || "Apple login failed");
      }
    } catch (err: any) {
      setError(err.message || "Apple login failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 p-4 bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      <div
        className="w-full max-w-md backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl shadow-2xl p-8 transition-smooth"
        style={{ minHeight: isSignup ? "580px" : "500px" }} 
      >
        {registrationSuccess ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Check Your Email!</h2>
            <p className="text-gray-700 mb-4">
              We've sent a verification link to <strong>{email}</strong>
            </p>
            <p className="text-gray-600 text-sm mb-6">
              Click the link in your email to verify your account. The link expires in 24 hours.
            </p>
            <button
              onClick={() => {
                setRegistrationSuccess(false);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setName("");
                setIsSignup(false);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white w-full py-3 rounded-xl font-semibold"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
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

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isSignup && (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/40 border border-white/30 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-400 focus:border-transparent rounded-xl"
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 bg-white/40 border border-white/30 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-teal-400 focus:border-transparent rounded-xl"
                />
              </div>

              <PasswordInput 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {isSignup && (
                <PasswordInput 
                  placeholder="Confirm Password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-xl font-semibold text-lg disabled:opacity-50"
              >
                {loading ? "Please wait..." : (isSignup ? "Create Account" : "Login")}
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
              <button
                type="button"
                onClick={() => googleLogin()}
                className="w-12 h-12 bg-white/50 hover:bg-white/70 rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/40"
                title="Login with Google"
                aria-label="Login with Google"
              >
                <svg viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                  <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.5-37.4-4.7-55.5H272.1v105h146.9c-6.3 33.9-25.6 62.7-54.6 81.8v68.1h88.3c51.6-47.5 80.8-117.6 80.8-199.4z"/>
                  <path fill="#34A853" d="M272.1 544.3c73.8 0 135.8-24.4 181-66.5l-88.3-68.1c-24.5 16.5-55.9 26-92.7 26-71 0-131.1-47.9-152.6-112.1H29.9v70.2c45 89.5 137.3 150.5 242.2 150.5z"/>
                  <path fill="#FBBC05" d="M119.5 323.6c-10.2-30.2-10.2-62.8 0-93l.1-70.2H29.9c-44.9 89.5-44.9 196.6 0 286.1l89.6-70.7z"/>
                  <path fill="#EA4335" d="M272.1 107.7c39.9-.6 78.1 14.9 107.4 43.4l80-80C414 24.6 344.3-.8 272.1 0 167.2 0 74.9 61 29.9 150.5l89.6 70.2C141 155.6 201.1 107.7 272.1 107.7z"/>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={handleAppleLogin}
                className="w-12 h-12 bg-white/50 hover:bg-white/70 rounded-full flex items-center justify-center transition-all backdrop-blur-sm border border-white/40"
                title="Login with Apple"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-900">
                  <path d="M17.569 12.503c-.034-2.995 2.445-4.438 2.556-4.51-1.398-2.042-3.57-2.323-4.338-2.349-1.828-.19-3.585 1.089-4.514 1.089-.948 0-2.376-1.07-3.906-1.039-1.998.031-3.85 1.177-4.877 2.979-2.096 3.636-.536 9.004 1.482 11.95 1.005 1.442 2.185 3.059 3.715 3.002 1.492-.062 2.056-.953 3.86-.953 1.785 0 2.311.953 3.888.918 1.612-.025 2.616-1.464 3.582-2.919 1.142-1.65 1.608-3.254 1.632-3.337-.036-.015-3.127-1.197-3.16-4.751zm-2.895-8.546c.816-1.002 1.366-2.373 1.216-3.75-1.176.048-2.644.795-3.497 1.776-.765.877-1.434 2.295-1.255 3.633 1.328.103 2.685-.669 3.536-1.659z"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;