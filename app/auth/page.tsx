"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const [showLogin, setShowLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"clerk" | "otp">("clerk");

  // OTP state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "verify">("email");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setShowLogin(mode !== "signup");
  }, [mode]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail.trim()) return;
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
        setOtpSuccess("Code sent! Check your email.");
        setCountdown(60);
      } else {
        setOtpError(data.error || "Failed to send code.");
      }
    } catch {
      setOtpError("Something went wrong.");
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
        setOtpSuccess("Verified! Redirecting...");
        // Session is now stored in database with httpOnly cookie
        // AuthContext will load user on next page render
        setTimeout(() => router.push("/"), 1000);
      } else {
        setOtpError(data.error || "Invalid code.");
      }
    } catch (error) {
      console.error("OTP verification error:", error instanceof Error ? error.message : String(error));
      setOtpError("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5 items-center justify-center p-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/6 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-md">
          <Link href="/" className="text-2xl font-extrabold font-headline tracking-tighter bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
            AiBlog
          </Link>
          <h2 className="mt-8 text-4xl font-extrabold font-headline tracking-tighter leading-[1.1]">
            Where AI Meets
            <br />
            <span className="text-gradient">Editorial Excellence</span>
          </h2>
          <p className="mt-4 text-on-surface-variant leading-relaxed">
            Join 120K+ creators leveraging generative intelligence to build professional authority and transform their careers.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: "auto_awesome", label: "AI Content Generation" },
              { icon: "timeline", label: "Career Progression" },
              { icon: "groups", label: "Community Network" },
              { icon: "analytics", label: "Deep Insights" },
            ].map((f) => (
              <Card key={f.label} className="bg-surface-container-low/50 border-outline-variant/10">
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="material-symbols-outlined text-primary text-lg">{f.icon}</span>
                  <span className="text-xs font-semibold text-on-surface-variant">{f.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center">

          {/* Method Toggle: Clerk vs OTP */}
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "clerk" | "otp")} className="mb-6">
            <TabsList className="bg-surface-container-high rounded-full p-1">
              <TabsTrigger value="clerk" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-on-primary data-[state=active]:shadow-md">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">account_circle</span>
                  Social / Email
                </span>
              </TabsTrigger>
              <TabsTrigger value="otp" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-on-primary data-[state=active]:shadow-md">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">pin</span>
                  Email OTP
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {authMethod === "clerk" ? (
            <>
              {/* Clerk Sign In / Sign Up toggle */}
              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => setShowLogin(true)}
                  variant={showLogin ? "default" : "outline"}
                  className={`rounded-full px-6 ${showLogin ? "shadow-lg shadow-primary/20" : ""}`}
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => setShowLogin(false)}
                  variant={!showLogin ? "default" : "outline"}
                  className={`rounded-full px-6 ${!showLogin ? "shadow-lg shadow-primary/20" : ""}`}
                  size="sm"
                >
                  Sign Up
                </Button>
              </div>

              {showLogin ? (
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
                  forceRedirectUrl="/dashboard"
                />
              ) : (
                <SignUp
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      rootBox: "w-full",
                      cardBox: "w-full shadow-none",
                      card: "bg-surface-container-low border border-outline-variant/20 shadow-none",
                    },
                  }}
                  routing="hash"
                  forceRedirectUrl="/dashboard"
                />
              )}
            </>
          ) : (
            /* OTP Login */
            <Card className="w-full bg-surface-container-low border-outline-variant/20">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">mail</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">
                    {otpStep === "email" ? "Sign in with Email OTP" : "Enter Verification Code"}
                  </h3>
                  {otpStep === "email" ? (
                    <p className="text-sm text-on-surface-variant mt-1">
                      We'll send a 6-digit code to your email
                    </p>
                  ) : (
                    <div className="text-sm text-on-surface-variant mt-1 flex items-center justify-center gap-2">
                      <span>Code sent to</span>
                      <Badge variant="secondary" className="font-mono">{otpEmail}</Badge>
                    </div>
                  )}
                </div>

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
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">Email Address</label>
                      <Input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="bg-surface-container border-outline-variant/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/50 h-12 rounded-xl"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full h-12 rounded-xl font-bold"
                    >
                      {otpLoading ? (
                        <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Sending...</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">send</span> Send Code</>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">6-Digit Code</label>
                      <Input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="bg-surface-container border-outline-variant/20 text-2xl font-mono font-bold text-center text-on-surface tracking-[0.5em] placeholder:text-on-surface-variant/30 focus:border-primary/50 h-14 rounded-xl"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={otpLoading || otpCode.length !== 6}
                      className="w-full h-12 rounded-xl font-bold"
                    >
                      {otpLoading ? (
                        <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Verifying...</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">verified</span> Verify &amp; Sign In</>
                      )}
                    </Button>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setOtpStep("email"); setOtpCode(""); setOtpError(""); setOtpSuccess(""); }}
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
          )}

          <p className="mt-6 text-center text-xs text-on-surface-variant">
            By continuing, you agree to our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
