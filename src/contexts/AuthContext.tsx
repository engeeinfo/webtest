import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface User {
  email: string;
  id: string;
  name: string;
  role: "admin" | "kitchen" | "customer" | "waiter";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  guestLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check for Supabase session
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || "User",
            role: session.user.user_metadata?.role || "customer",
          });
        } else if (mounted) {
          // Fallback to guest session if no Auth session
          const guestUser = sessionStorage.getItem("guest_user");
          if (guestUser) {
            setUser(JSON.parse(guestUser));
          }
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || "User",
          role: session.user.user_metadata?.role || "customer",
        });
        // Clear guest session if real user logs in
        sessionStorage.removeItem("guest_user");
      } else {
        // If logged out, check if we want to validly revert to guest or null
        // Usually null is better on explicit logout
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      throw error;
    }

    console.log("Login success:", data);
  };

  const guestLogin = () => {
    const guestUser: User = {
      id: "guest-" + Date.now(),
      email: "guest@example.com",
      name: "Guest",
      role: "customer",
    };
    setUser(guestUser);
    sessionStorage.setItem("guest_user", JSON.stringify(guestUser));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("guest_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, guestLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

