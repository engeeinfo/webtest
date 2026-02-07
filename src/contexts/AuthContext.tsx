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
