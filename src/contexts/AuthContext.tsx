import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE, publicAnonKey } from "../utils/supabase/info";
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

// Safe storage that falls back to memory if localStorage is unavailable
class SafeStorage {
  private memoryStorage: { [key: string]: string } = {};
  private useLocalStorage = false;

  constructor() {
    try {
      // Test if localStorage is accessible
      const testKey = "__test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      this.useLocalStorage = true;
    } catch (e) {
      console.log("localStorage not available, using memory storage");
      this.useLocalStorage = false;
    }
  }

  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return this.memoryStorage[key] || null;
      }
    }
    return this.memoryStorage[key] || null;
  }

  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        this.memoryStorage[key] = value;
      }
    }
    this.memoryStorage[key] = value;
  }

  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        delete this.memoryStorage[key];
      }
    }
    delete this.memoryStorage[key];
  }
}

const storage = new SafeStorage();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Supabase session
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // Map Supabase user to App user
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || "User",
          role: session.user.user_metadata?.role || "customer",
        });
      }
      setLoading(false);
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || "User",
          role: session.user.user_metadata?.role || "customer",
        });
        // Sync to local storage for legacy compatibility if needed
        storage.setItem(
          "user",
          JSON.stringify({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || "User",
            role: session.user.user_metadata?.role || "customer",
          })
        );
      } else {
        setUser(null);
        storage.removeItem("user");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // Attempt Supabase login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      throw new Error(error.message);
    }

    // Auth state change listener will update the user state
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    storage.removeItem("user");
    sessionStorage.removeItem("user");
  };

  const guestLogin = () => {
    const guestUser: User = {
      id: "guest-" + Date.now(),
      email: "guest@example.com",
      name: "Guest",
      role: "customer",
    };

    // For guest login, we don't necessarily need Supabase auth unless we want anonymous users
    // Keeping local state for guest for now
    setUser(guestUser);
    sessionStorage.setItem("user", JSON.stringify(guestUser));
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
