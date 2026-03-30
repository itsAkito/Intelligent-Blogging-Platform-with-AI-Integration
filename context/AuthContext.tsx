"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import ConsentModal from "@/components/ConsentModal";

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
  const { signOut: clerkSignOut } = useClerk();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("user");
  const [showConsent, setShowConsent] = useState(false);
  const router = useRouter();

  // Don't show consent modal for admin routes
  const isAdminRoute = pathname?.includes("/admin");

  const syncUserToSupabase = useCallback(async () => {
    if (!clerkUser) return;

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
          // Don't show consent for admins
          if (!isAdminRoute && data.profile.role !== "admin") {
            setShowConsent(true);
          } else {
            setLoading(false);
          }
          return;
        }
      }

      setProfile(fallbackProfile);
      setRole(userRole);
      // Don't show consent for admins
      if (!isAdminRoute && userRole !== "admin") {
        setShowConsent(true);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Clerk sync error:", error instanceof Error ? error.message : String(error));
      setProfile(fallbackProfile);
      setRole(userRole);
      if (!isAdminRoute && userRole !== "admin") {
        setShowConsent(true);
      } else {
        setLoading(false);
      }
    }
  }, [isAdminRoute]);

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
        
        // Show consent modal ONLY for regular users after OTP verification
        if (!isAdminRoute && profile.role === "user") {
          setShowConsent(true);
        } else {
          setLoading(false);
        }
        return true;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error loading OTP session:", errorMsg);
    }
    return false;
  }, [isAdminRoute]);

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        syncUserToSupabase().finally(() => setLoading(false));
      } else {
        loadOtpUser().finally(() => setLoading(false));
      }
    }
  }, [isLoaded, isSignedIn, clerkUser, syncUserToSupabase, loadOtpUser]);

  const isAuthenticated = !!isSignedIn || !!profile;

  useEffect(() => {
    if (loading) return;

    if (pathname?.startsWith("/auth") && role === "admin" && isAuthenticated) {
      router.replace("/admin");
    }
  }, [loading, pathname, role, isAuthenticated, router]);

  const handleConsentAccept = async () => {
    setShowConsent(false);
    setLoading(false);
    const dashboardUrl = role === "admin" ? "/admin" : "/dashboard";
    router.replace(dashboardUrl);
  };

  const handleConsentDeny = async () => {
    setShowConsent(false);
    if (isSignedIn) {
      await clerkSignOut();
    }
    setProfile(null);
    setRole("user");
    setLoading(false);
    router.push("/");
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/otp/session", {
        method: "DELETE",
        credentials: "include",
      });
    } catch {}

    if (isSignedIn) {
      await clerkSignOut();
    }

    setProfile(null);
    setRole("user");
    router.push("/");
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
      <ConsentModal
        isOpen={showConsent}
        userRole={role as "user" | "admin"}
        onAccept={handleConsentAccept}
        onDeny={handleConsentDeny}
      />
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
