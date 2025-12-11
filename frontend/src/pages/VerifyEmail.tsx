import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
          setStatus("error");
          setMessage("Invalid verification link");
          return;
        }

        const response = await fetch(
          `http://localhost:8000/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error || "Email verification failed");
          return;
        }

        setStatus("success");
        setMessage(data.message);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while verifying your email");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#eaf6f2] to-[#b6c9c3]">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/30 border border-white/40 rounded-3xl shadow-2xl p-8 text-center">
        {status === "loading" && (
          <>
            <Loader className="h-16 w-16 text-teal-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
            <p className="text-gray-700">Please wait while we verify your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <p className="text-sm text-gray-600">Redirecting to login page...</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl font-semibold transition-colors"
            >
              Back to Registration
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
