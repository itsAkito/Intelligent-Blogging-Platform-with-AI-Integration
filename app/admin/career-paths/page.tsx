"use client";

import { useState, useEffect } from "react";
import AdminSideNav from "@/components/AdminSideNav";
import AdminTopNav from "@/components/AdminTopNav";
import CareerTracksPanel from "@/components/admin/CareerTracksPanel";
import ProgressionEditor from "@/components/admin/ProgressionEditor";
import AIInsightsPanel from "@/components/admin/AIInsightsPanel";
import CareerPathVisualizer from "@/components/admin/CareerPathVisualizer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CareerPathsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/admin/login");
      return;
    }
    if (user && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetchCareerTracks();
  }, []);

  const fetchCareerTracks = async () => {
    try {
      const response = await fetch("/api/admin/career-tracks");
      const data = await response.json();
      setTracks(data);
      if (data.length > 0) setSelectedTrack(data[0]);
    } catch (error) {
      console.error("Failed to fetch career tracks:", error);
    }
  };

  return (
    <div className="dark min-h-screen bg-background text-on-background font-body">
      <AdminSideNav activePage="career-paths" />
      <AdminTopNav activePage="career-paths" />

      <main className="md:ml-64 pt-20 min-h-screen p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h2 className="text-5xl font-extrabold font-headline tracking-tighter text-white mb-2">
              Career <span className="text-primary italic">Architecture</span>
            </h2>
            <p className="text-on-surface-variant text-sm">
              Define milestones, perks, and AI-driven growth metrics for creator progression.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-surface-container-high border border-outline-variant/20 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface transition-all">
              <span className="material-symbols-outlined text-sm mr-1 align-middle">download</span>
              Export Schema
            </button>
            <button className="px-5 py-2.5 bg-linear-to-r from-primary to-primary-container text-on-primary-fixed rounded-lg text-xs font-bold hover:scale-[1.02] transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-sm mr-1 align-middle">add</span>
              New Track
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Career Tracks Sidebar */}
          <CareerTracksPanel
            tracks={tracks}
            selectedTrack={selectedTrack}
            onSelectTrack={setSelectedTrack}
            onTracksUpdate={fetchCareerTracks}
          />

          {/* Progression Editor Area */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {selectedTrack && <ProgressionEditor track={selectedTrack} />}

            {/* AI Insights & Recommendations */}
            <AIInsightsPanel />

            {/* Config Action Bar */}
            <div className="glass-panel rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <p className="text-xs text-on-surface-variant">
                  Unsaved changes detected in
                  <span className="text-white font-bold ml-1">{selectedTrack?.name || "Career Track"}</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-5 py-2 text-on-surface-variant text-xs font-bold hover:text-on-surface transition-colors">
                  Discard
                </button>
                <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-primary/10">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Career Path Visualizer */}
        <CareerPathVisualizer />
      </main>
    </div>
  );
}
