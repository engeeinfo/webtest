import { User, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, user, guestLogin } = useAuth();
  const navigate = useNavigate();

  // Navigate when user is set
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "kitchen") {
        navigate("/kitchen", { replace: true });
      } else {
        navigate("/customer", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        toast.success("Account created! You can now log in.");
        setIsSignUp(false);
      } else {
        await login(email, password);
      }
      // Navigation will happen via useEffect above
    } catch (err: any) {
      console.error("Auth failed:", err);
      setError(
        err.message ||
          (isSignUp
            ? "Sign up failed. Try again."
            : "Login failed. Check your credentials."),
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    if (role === "customer") {
      guestLogin();
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Restaurant Hub</h1>
          <p className="text-purple-200">Real-Time Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading
                ? isSignUp
                  ? "Creating Account..."
                  : "Logging in..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-sm text-purple-200 hover:text-white underline outline-none"
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Need an account? Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-purple-200">
                  Quick Login
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => quickLogin("customer")}
                className="flex-1 flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all"
              >
                <User className="w-6 h-6 text-green-400" />
                <span className="text-xs text-white">Guest Login</span>
              </button>
              
              <button
                onClick={() => navigate("/customer")}
                className="flex-1 flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all"
              >
                <UtensilsCrossed className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-white">View Tables Only</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-purple-200 text-sm">
          <p>© {new Date().getFullYear()} All rights reserved by Rk prasad</p>
        </div>
      </div>
    </div>
  );
}
