import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE, publicAnonKey } from "../utils/supabase/info";

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
    // Check for existing session
    try {
      const storedUser = storage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Clean up legacy guest sessions from localStorage
        if (parsedUser.email === "guest@example.com") {
          storage.removeItem("user");
          sessionStorage.setItem("user", storedUser);
        }
        setUser(parsedUser);
      } else {
        // Check session storage for guest session
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
          setUser(JSON.parse(sessionUser));
        }
      }
    } catch (error) {
      console.error("Error loading user from storage:", error);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error("Login failed with error:", error);
        throw new Error(error || "Login failed");
      }

      const userData = await response.json();
      console.log("Login successful, user data:", userData);

      // Save to storage first
      try {
        storage.setItem("user", JSON.stringify(userData));
        console.log("User saved to storage");
      } catch (error) {
        console.error("Error saving user to storage:", error);
      }

      // Then update state (this will trigger navigation in Login component)
      setUser(userData);
      console.log("User state updated");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const guestLogin = () => {
    const guestUser: User = {
      id: "guest-" + Date.now(),
      email: "guest@example.com",
      name: "Guest",
      role: "customer",
    };
    setUser(guestUser);
    // Use sessionStorage for guest users so they are logged out when tab closes
    sessionStorage.setItem("user", JSON.stringify(guestUser));
    // Do not save to persistent storage
    // storage.setItem("user", JSON.stringify(guestUser));
  };

  const logout = () => {
    setUser(null);
    try {
      storage.removeItem("user");
      sessionStorage.removeItem("user");
    } catch (error) {
      console.error("Error removing user from storage:", error);
    }
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
