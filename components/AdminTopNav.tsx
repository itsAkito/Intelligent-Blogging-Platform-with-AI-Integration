"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AdminTopNavProps {
  activePage?: string;
}

export default function AdminTopNav({ activePage = "overview" }: AdminTopNavProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // Clear OTP session cookie if present
      document.cookie = "otp_session_token=; max-age=0; path=/";
      router.push("/admin/login");
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0e0e0e]/60 backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] h-16 flex justify-between items-center px-8 font-headline tracking-tight">
      <div className="flex items-center gap-8">
        <Link href="/admin" className="text-xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Synthetix Admin
        </Link>
        <div className="hidden md:flex gap-6 text-sm">
          <Link href="/admin" className={activePage === "overview" ? "text-blue-400 font-bold" : "text-zinc-500 hover:text-blue-300 transition-colors"}>
            Platform
          </Link>
          <Link href="/admin/analytics" className={activePage === "analytics" ? "text-blue-400 font-bold" : "text-zinc-500 hover:text-blue-300 transition-colors"}>
            Insights
          </Link>
          <Link href="/admin/users" className={activePage === "users" ? "text-blue-400 font-bold" : "text-zinc-500 hover:text-blue-300 transition-colors"}>
            Audit
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <span className="material-symbols-outlined text-zinc-500 hover:text-blue-300 cursor-pointer text-[20px]">sensors</span>
        <span className="material-symbols-outlined text-zinc-500 hover:text-blue-300 cursor-pointer text-[20px]">notifications</span>
        <span className="material-symbols-outlined text-zinc-500 hover:text-blue-300 cursor-pointer text-[20px]">settings</span>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/20 overflow-hidden hover:border-blue-400 transition-colors"
          >
            <img
              className="w-full h-full object-cover"
              alt="Admin avatar"
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
            />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-outline-variant/20 rounded-lg shadow-xl z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
