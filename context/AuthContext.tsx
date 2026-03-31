"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  session: any;
  loading: boolean;
  role: string;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("user");
  const isAdminRoute = pathname?.includes("/admin");
  const isAuthRoute = pathname?.startsWith("/auth");

  const syncUserToSupabase = useCallback(async () => {
    if (!clerkUser) {
      setLoading(false);
      return;
    }

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gmail.com";
    const email = clerkUser.primaryEmailAddress?.emailAddress || "";
    const userRole = email.toLowerCase() === adminEmail.toLowerCase() ? "admin" : "user";

    const fallbackProfile: Profile = {
      id: clerkUser.id,
      email,
      name: clerkUser.fullName || clerkUser.firstName || "User",
      avatar_url: clerkUser.imageUrl || undefined,
      role: userRole,
    };

    try {
      const res = await fetch("/api/user/profile/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: clerkUser.id,
          email,
          name: clerkUser.fullName || clerkUser.firstName || "User",
          avatar_url: clerkUser.imageUrl || null,
          role: userRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setRole(data.profile.role || "user");
          setLoading(false);
          return;
        }
      }

      setProfile(fallbackProfile);
      setRole(userRole);
      setLoading(false);
    } catch (error) {
      // Network hiccups should not surface as hard console errors in normal auth flow.
      setProfile(fallbackProfile);
      setRole(userRole);
      setLoading(false);
    }
  }, [clerkUser, isAdminRoute]);

  // Check for OTP-based login from database session
  const loadOtpUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/otp/session", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const { user } = data;
        
        const profile: Profile = {
          id: user.id,
          email: user.email,
          name: user.name || user.email?.split("@")[0] || "User",
          avatar_url: user.avatar_url,
          role: user.role || "user",
        };
        
        setProfile(profile);
        setRole(profile.role);
        
        setLoading(false);
        return true;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error loading OTP session:", errorMsg);
    }
    
    // Fallback for admin cookie session — probe the lightweight /api/admin/me endpoint.
    try {
      const adminProbe = await fetch("/api/admin/me", {
        method: "GET",
        credentials: "include",
      });

      if (adminProbe.ok) {
        const data = await adminProbe.json();
        const adminProfile: Profile = {
          id: data.admin?.id || "admin-session",
          email: data.admin?.email || (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gmail.com"),
          name: data.admin?.name || "Administrator",
          role: "admin",
        };
        setProfile(adminProfile);
        setRole("admin");
        setLoading(false);
        return true;
      }
    } catch {
      // Ignore and continue to unauthenticated state.
    }

    // If no OTP session found, just finish loading
    setLoading(false);
    return false;
  }, [isAdminRoute]);

  // Lifecycle: Load auth state once
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      syncUserToSupabase();
      return;
    }

    // Avoid noisy 401 session probes on the auth entry route when user is logged out.
    if (isAuthRoute) {
      setLoading(false);
      return;
    }

    loadOtpUser().catch(() => {
      // If OTP load fails, just finish loading
      setLoading(false);
    });
  }, [isLoaded, isSignedIn, clerkUser, syncUserToSupabase, loadOtpUser, isAuthRoute]);

  const isAuthenticated = !!isSignedIn || !!profile;

  const signOut = async () => {
    // Clear local state immediately so UI responds at once
    setProfile(null);
    setRole("user");

    // Call the unified sign-out API route.
    // This route handles ALL auth types (Clerk, OTP, admin) via plain HTTP —
    // NO Clerk Server Actions are involved, so there are no stale-hash errors.
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    } catch {
      // Non-fatal — proceed to redirect regardless
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_session_start");
    }

    // Hard navigate to homepage so Clerk middleware re-evaluates fresh cookies
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user: clerkUser
          ? {
              id: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress,
              name: clerkUser.fullName || clerkUser.firstName,
            }
          : profile
          ? { id: profile.id, email: profile.email, name: profile.name }
          : null,
        profile,
        session: isSignedIn ? { user: clerkUser } : profile ? { user: profile } : null,
        loading,
        role,
        signOut,
        logout: signOut,
        isAuthenticated,
        isAdmin: role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
