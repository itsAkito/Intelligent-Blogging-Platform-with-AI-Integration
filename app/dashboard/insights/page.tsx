"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/NavBar";
import SideNavBar from "@/components/SideNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function InsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "1Y">("90D");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const fetchAnalyticsData = useCallback(async (range: "7D" | "30D" | "90D" | "1Y") => {
    if (!user?.id) return;
    setLoadingAnalytics(true);
    try {
      const response = await fetch(`/api/user/analytics?timeframe=${range}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAnalyticsData(dateRange);
  }, [dateRange, fetchAnalyticsData]);

  const growthData = analyticsData?.dailyData?.map((d: any) => d.views || 0) || [35, 42, 38, 56, 48, 72, 65, 80, 74, 92, 88, 95];
  const maxGrowth = Math.max(...growthData);

  const trendingTopics = analyticsData?.trendingTopics || [
    { topic: "AI-Driven Content Strategy", heat: 94 },
    { topic: "Synthetic Media Ethics", heat: 87 },
    { topic: "Career Automation", heat: 76 },
    { topic: "Generative Design Thinking", heat: 68 },
    { topic: "Professional Branding with AI", heat: 61 },
  ];

  const audienceSegments = [
    { label: "Tech Professionals", pct: 38, color: "bg-primary" },
    { label: "Content Creators", pct: 28, color: "bg-secondary" },
    { label: "Career Changers", pct: 20, color: "bg-tertiary" },
    { label: "Students", pct: 14, color: "bg-error" },
  ];

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <SideNavBar activePage="insights" />
        <main className="flex-1 lg:ml-64 pt-24 pb-12 px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-on-surface">
                  Insights & <span className="text-gradient italic">Intelligence</span>
                </h1>
                <p className="text-sm text-on-surface-variant mt-2 max-w-lg">
                  Deep analytics powered by AI to optimize your content strategy and career growth.
                </p>
              </div>
              <button
                onClick={fetchAIInsights}
                disabled={loadingAI}
                className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-secondary to-tertiary text-white rounded-lg font-bold text-sm hover:scale-[1.02] transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                {loadingAI ? "Analyzing..." : "Generate AI Report"}
              </button>
            </header>

            {/* Growth Pulse Chart */}
            <div className="glass-panel rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Growth Pulse</span>
                  <h2 className="text-2xl font-bold font-headline mt-1">Content Performance Trend</h2>
                </div>
                <div className="flex gap-2">
                  {(["7D", "30D", "90D", "1Y"] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setDateRange(period)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        dateRange === period
                          ? "bg-primary text-on-primary shadow-md shadow-primary/30"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-2 h-40">
                {growthData.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-linear-to-t from-primary/40 to-primary rounded-t-sm transition-all hover:from-primary/60 hover:to-primary"
                      style={{ height: `${(val / maxGrowth) * 100}%` }}
                    ></div>
                    <span className="text-[9px] text-on-surface-variant">{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Audience Mapping */}
              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-lg font-bold font-headline mb-4">Audience Mapping</h3>
                <div className="space-y-4">
                  {audienceSegments.map((seg) => (
                    <div key={seg.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium">{seg.label}</span>
                        <span className="text-on-surface-variant">{seg.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full">
                        <div className={`h-full ${seg.color} rounded-full`} style={{ width: `${seg.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Content Gap Analysis */}
              <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="text-lg font-bold font-headline">AI Gap Analysis</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { topic: "AI Ethics Deep Dives", opportunity: "High", icon: "priority_high" },
                    { topic: "Tutorial Content", opportunity: "Medium", icon: "school" },
                    { topic: "Case Study Series", opportunity: "High", icon: "cases" },
                  ].map((gap) => (
                    <div key={gap.topic} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low">
                      <span className="material-symbols-outlined text-primary text-sm">{gap.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold">{gap.topic}</p>
                        <p className="text-[10px] text-on-surface-variant">Opportunity: {gap.opportunity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-lg font-bold font-headline mb-4">Trending Topics</h3>
                <div className="space-y-3">
                  {trendingTopics.map((t, i) => (
                    <div key={t.topic} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-on-surface-variant w-5">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{t.topic}</p>
                        <div className="w-full h-1 bg-surface-container-highest rounded-full mt-1">
                          <div className="h-full bg-linear-to-r from-primary to-secondary rounded-full" style={{ width: `${t.heat}%` }}></div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary">{t.heat}°</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Generated Insights */}
            {insights && (
              <div className="glass-panel rounded-2xl p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="text-xl font-bold font-headline">AI Performance Report</h3>
                </div>
                <div className="prose prose-invert max-w-none text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {insights}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
