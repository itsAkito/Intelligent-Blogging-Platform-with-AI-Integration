"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface SideNavBarProps {
  activePage?: string;
}

export default function SideNavBar({ activePage = "home" }: SideNavBarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  const navItems = [
    { id: "community", label: "Community", icon: "people", href: "/community" },
    { id: "jobs", label: "Jobs", icon: "work", href: "/jobs" },
    { id: "home", label: "Career Hub", icon: "trending_up", href: "/dashboard/career" },
    { id: "portfolio", label: "Portfolio", icon: "deployed_code", href: "/dashboard/portfolio" },
    { id: "collaboration", label: "Collaboration", icon: "group", href: "/dashboard/collaboration" },
    { id: "resume", label: "Resume Builder", icon: "description", href: "/dashboard/resume" },
    { id: "settings", label: "Settings", icon: "settings", href: "/dashboard/settings" },
  ];

  return (
    <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#0e0e0e] flex-col pt-20 pb-8 z-40">
      {/* User Profile */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "AiBlog"}`}
              alt="User"
            />
            <AvatarFallback className="rounded-lg bg-surface-container-high text-xs">AI</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-headline text-sm font-bold tracking-tight text-on-surface">
              AiBlog Editorial
            </p>
            <p className="font-label text-[10px] text-primary uppercase tracking-widest">
              Career Mode Active
            </p>
          </div>
        </div>
      </div>

      <Separator className="mb-2 bg-white/5" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col space-y-0.5 px-3">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 font-headline uppercase tracking-widest text-[10px] ${
              activePage === item.id
                ? "bg-primary/10 text-primary font-semibold"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 mt-auto space-y-2">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 py-3 h-auto rounded-lg font-bold text-xs uppercase tracking-widest gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </Button>
      </div>
    </aside>
  );
}
