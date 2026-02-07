import { ChefHat, Shield, User, Users, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
=======
  const [isSignUp, setIsSignUp] = useState(false);
>>>>>>> ff40e0f079c428a1ab1e18f6e586876db6206689
  const { login, user, guestLogin } = useAuth();
  const navigate = useNavigate();

  // Navigate when user is set
  useEffect(() => {
    if (user) {
<<<<<<< HEAD
      console.log("User logged in:", user);
      setLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    if (role === "customer") {
      guestLogin();
      return;
    }
    const credentials: { [key: string]: { email: string; password: string } } =
      {
        admin: { email: "admin@restaurant.com", password: "admin123" },
        kitchen: { email: "kitchen@restaurant.com", password: "kitchen123" },
        waiter: { email: "waiter@restaurant.com", password: "waiter123" },
        // customer removed from credentials list as it now uses guestLogin
      };

    const cred = credentials[role];
    setEmail(cred.email);
    setPassword(cred.password);
    setError("");
    setLoading(true);

    console.log("Quick login attempt:", cred.email);

    try {
      await login(cred.email, cred.password);
      // Navigation will happen via useEffect above
    } catch (err: any) {
      console.error("Quick login failed:", err);
      setError(err.message || "Login failed");
      setLoading(false);
    }
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-purple-200">
                  Quick Login (Demo)
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin("admin")}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all"
              >
                <Shield className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-white">Admin</span>
              </button>

              <button
                onClick={() => quickLogin("kitchen")}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all"
              >
                <ChefHat className="w-6 h-6 text-pink-400" />
                <span className="text-xs text-white">Kitchen</span>
              </button>

              <button
                onClick={() => quickLogin("waiter")}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all"
              >
                <Users className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-white">Waiter</span>
              </button>

              <button
                onClick={() => quickLogin("customer")}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg transition-all"
              >
                <User className="w-6 h-6 text-green-400" />
                <span className="text-xs text-white">Guest Entry</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-purple-200 text-sm">
          <p>Demo Credentials:</p>
          <p className="text-xs text-purple-300 mt-1">
            Admin: admin@restaurant.com / admin123
            <br />
            Kitchen: kitchen@restaurant.com / kitchen123
            <br />
            Waiter: waiter@restaurant.com / waiter123
          </p>
        </div>
      </div>
    </div>
  );
}
