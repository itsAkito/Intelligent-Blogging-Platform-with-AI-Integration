"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gmail.com";

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!loading) {
      if (isAdmin && user) {
        router.push("/admin");
      }
    }
  }, [loading, isAdmin, user, router]);

  const [authMethod, setAuthMethod] = useState<"clerk" | "otp">("otp");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "verify">("email");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) return;

    // Check if email is admin email
    if (otpEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      setOtpError("This email is not an admin account. Only admin emails can login here.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep("verify");
        setOtpSuccess("Code sent to your email!");
        setCountdown(60);
      } else {
        setOtpError(data.error || "Failed to send code.");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("OTP send error:", errorMsg);
      setOtpError("Something went wrong. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        // Verify it's an admin account
        if (data.user.role !== "admin") {
          setOtpError("This account is not an admin account.");
          return;
        }

        setOtpSuccess("Verified! Redirecting to admin dashboard...");
        // Session is stored in httpOnly cookie by the server
        setTimeout(() => router.push("/admin"), 1500);
      } else {
        setOtpError(data.error || "Invalid code.");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("OTP verification error:", errorMsg);
      setOtpError("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5 items-center justify-center p-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/6 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-md">
          <Link
            href="/"
            className="text-2xl font-extrabold font-headline tracking-tighter bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent"
          >
            AiBlog
          </Link>
          <h2 className="mt-8 text-4xl font-extrabold font-headline tracking-tighter leading-[1.1]">
            Administrator
            <br />
            <span className="text-gradient">Dashboard Portal</span>
          </h2>
          <p className="mt-4 text-on-surface-variant leading-relaxed">
            Secure access to AiBlog administration panel. Manage users, posts, analytics, and system-wide settings.
          </p>
          <div className="mt-10 space-y-3">
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">shield</span>
              <span className="text-sm">Secure admin-only access</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">dashboard</span>
              <span className="text-sm">Full system control</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">analytics</span>
              <span className="text-sm">Real-time analytics</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">person</span>
              <span className="text-sm">User management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Admin Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">admin_panel_settings</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Admin Login</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Access restricted to administrators only
            </p>
            <Badge variant="outline" className="mt-4">
              Required Email: {adminEmail}
            </Badge>
          </div>

          {/* Method Toggle: Clerk vs OTP */}
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "clerk" | "otp")} className="mb-6">
            <TabsList className="bg-surface-container-high rounded-full p-1">
              <TabsTrigger value="otp" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-on-primary data-[state=active]:shadow-md">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  Email OTP
                </span>
              </TabsTrigger>
              <TabsTrigger value="clerk" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-on-primary data-[state=active]:shadow-md">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">account_circle</span>
                  Social Login
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* OTP Login */}
          {authMethod === "otp" ? (
            <Card className="w-full bg-surface-container-low border-outline-variant/20">
              <CardContent className="p-8">
                {otpError && (
                  <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {otpError}
                  </div>
                )}
                {otpSuccess && !otpError && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {otpSuccess}
                  </div>
                )}

                {otpStep === "email" ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                        Admin Email
                      </label>
                      <Input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder={adminEmail}
                        className="bg-surface-container border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 h-12 rounded-xl"
                        required
                      />
                      <p className="text-xs text-on-surface-variant mt-2">
                        Enter the admin email address to receive a login code
                      </p>
                    </div>
                    <Button type="submit" disabled={otpLoading} className="w-full h-12 rounded-xl font-bold">
                      {otpLoading ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm mr-1">mail</span>
                          Send Code
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
                        6-Digit Code
                      </label>
                      <Input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="bg-surface-container border-outline-variant/20 text-2xl font-mono font-bold text-center text-on-surface tracking-[0.5em] placeholder:text-on-surface-variant/30 focus:border-primary/50 h-14 rounded-xl"
                        required
                      />
                      <p className="text-xs text-on-surface-variant mt-2">
                        Enter the 6-digit code sent to {otpEmail}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={otpLoading || otpCode.length !== 6}
                      className="w-full h-12 rounded-xl font-bold"
                    >
                      {otpLoading ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm mr-1">verified</span>
                          Verify &amp; Login
                        </>
                      )}
                    </Button>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setOtpStep("email");
                          setOtpCode("");
                          setOtpError("");
                          setOtpSuccess("");
                        }}
                        className="text-xs h-auto p-0 hover:text-primary"
                      >
                        Change email
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSendOTP}
                        disabled={countdown > 0 || otpLoading}
                        className="text-xs h-auto p-0 hover:text-primary"
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            // Clerk Sign In
            <div className="w-full">
              <div className="mb-4 text-center text-xs text-on-surface-variant">
                Sign in with your account configured as admin in Clerk
              </div>
              <SignIn
                appearance={{
                  baseTheme: dark,
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full shadow-none",
                    card: "bg-surface-container-low border border-outline-variant/20 shadow-none",
                  },
                }}
                routing="hash"
                forceRedirectUrl="/admin"
              />
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-on-surface-variant flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-primary flex-shrink-0 mt-0.5">
                lock
              </span>
              <span>
                Access to this page is restricted to administrators only. All login attempts are logged for security purposes.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
