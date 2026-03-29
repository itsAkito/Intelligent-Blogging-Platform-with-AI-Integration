"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isAdmin, isAuthenticated, profile, user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // Determine if user is OTP-based (authenticated but not a Clerk user)
  const isOtpUser = isAuthenticated && !user?.id?.startsWith("user_");

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/60 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] font-headline">
        <nav className="flex justify-between items-center px-6 lg:px-12 h-16 w-full max-w-350 mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tighter bg-linear-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
              AiBlog
            </Link>
            <div className="hidden md:flex gap-6 text-sm">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="text-zinc-400 hover:text-primary transition-colors font-medium">Dashboard</Link>
                  <Link href="/community" className="text-zinc-400 hover:text-primary transition-colors font-medium">Community</Link>
                  <Link href="/editor" className="text-zinc-400 hover:text-primary transition-colors font-medium">Write</Link>
                  <Link href="/careers" className="text-zinc-400 hover:text-primary transition-colors font-medium">Careers</Link>
                  <Link href="/dashboard/insights" className="text-zinc-400 hover:text-primary transition-colors font-medium">Analytics</Link>
                </>
              ) : (
                <>
                  <Link href="/" className="text-zinc-400 hover:text-primary transition-colors font-medium">About</Link>
                  <Link href="/community" className="text-zinc-400 hover:text-primary transition-colors font-medium">Community</Link>
                  <Link href="/careers" className="text-zinc-400 hover:text-primary transition-colors font-medium">Careers</Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <NotificationsDropdown />
                
                {isAdmin && (
                  <Link href="/admin" className="hidden sm:block text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
                    Admin
                  </Link>
                )}
                
                {/* Show OTP User Profile or Clerk Profile */}
                {isOtpUser && profile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full overflow-hidden">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {profile.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-semibold text-white">{profile.name}</p>
                        <p className="text-xs text-zinc-400">{profile.email}</p>
                        {profile.role === "admin" && (
                          <p className="text-xs text-blue-400 font-semibold mt-1">👑 Admin</p>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/settings" className="cursor-pointer">
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      {profile.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-red-400 cursor-pointer">
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                      },
                    }}
                  />
                )}
                
                <Button asChild className="px-5 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed rounded-full font-bold text-sm hover:scale-[1.02] shadow-lg shadow-primary/20">
                  <Link href="/editor">Create Post</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:block text-sm font-semibold text-zinc-400 hover:text-white">
                  <Link href="/auth">Login</Link>
                </Button>
                <Button asChild className="px-5 bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed rounded-full font-bold text-sm hover:scale-[1.02] shadow-lg shadow-primary/20">
                  <Link href="/pricing">Get Started</Link>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden text-zinc-400" onClick={() => setMenuOpen(!menuOpen)}>
              <span className="material-symbols-outlined">menu</span>
            </Button>
          </div>
        </nav>
        {menuOpen && (
          <div className="md:hidden bg-surface-container-low border-t border-white/5 px-6 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link href="/community" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Community</Link>
                <Link href="/editor" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Editor</Link>
                <Link href="/careers" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Careers</Link>
                <Link href="/dashboard/insights" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Analytics</Link>
                {isAdmin && <Link href="/admin" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Admin</Link>}
                <Separator className="my-2" />
                <div className="pt-2">
                  {isOtpUser && profile ? (
                    <Button 
                      onClick={signOut}
                      variant="ghost"
                      className="w-full justify-start text-red-400 hover:text-red-300"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/pricing" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Pricing</Link>
                <Link href="/careers" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>Careers</Link>
                <Link href="/about" className="block text-sm text-zinc-400 hover:text-white" onClick={() => setMenuOpen(false)}>About</Link>
                <Link href="/auth" className="block text-sm text-primary font-semibold" onClick={() => setMenuOpen(false)}>Login / Sign Up</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Login Popup Modal */}
      {showLoginPopup && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginPopup(false)}>
          <div className="relative bg-surface-container border border-outline-variant/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={() => setShowLoginPopup(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </Button>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
              </div>
              <h3 className="text-2xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Sign in to continue</h3>
              <p className="text-sm text-on-surface-variant mb-8">Join thousands of creators. Sign in with Google to access the full platform.</p>
              <Button asChild className="w-full h-auto py-3.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-100 shadow-lg">
              <Link
                href="/auth"
                className="flex items-center justify-center gap-3"
                onClick={() => setShowLoginPopup(false)}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </Link>
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-surface-container px-3 text-on-surface-variant">or</span></div>
              </div>
              <Button asChild variant="outline" className="w-full h-auto py-3.5 bg-surface-container-high border-outline-variant/20 text-on-surface font-bold rounded-xl text-sm hover:bg-surface-container-highest">
              <Link
                href="/auth"
                className="flex items-center justify-center gap-2"
                onClick={() => setShowLoginPopup(false)}
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                Sign in with Email / OTP
              </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}