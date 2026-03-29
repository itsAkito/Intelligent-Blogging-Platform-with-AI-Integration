"use client";

import { useState, useEffect } from "react";
import AdminSideNav from "@/components/AdminSideNav";
import AdminTopNav from "@/components/AdminTopNav";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SystemStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  activeSubscriptions: number;
  jobApplications: number;
  openJobs: number;
  systemHealth: number;
}

interface TopCreator {
  name: string;
  posts: number;
  views: string;
  level: string;
}

interface RecentComment {
  id: string;
  author: string;
  content: string;
  post: string;
  time: string;
  status: "approved" | "pending";
}

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    activeSubscriptions: 0,
    jobApplications: 0,
    openJobs: 0,
    systemHealth: 98.7,
  });
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/auth"); return; }
    if (!isAdmin) { router.push("/dashboard"); return; }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, postsRes, commentsRes, analyticsRes, jobsRes, subscriptionsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/posts?limit=100"),
          fetch("/api/comments?limit=50"),
          fetch("/api/analytics?timeframe=7d"),
          fetch("/api/arjuna/jobs?limit=100"),
          fetch("/api/subscriptions?plansOnly=false"),
        ]);

        const usersData = usersRes.ok ? await usersRes.json() : {};
        const postsData = postsRes.ok ? await postsRes.json() : {};
        const commentsData = commentsRes.ok ? await commentsRes.json() : {};
        const analyticsData = analyticsRes.ok ? await analyticsRes.json() : {};
        const jobsData = jobsRes.ok ? await jobsRes.json() : {};
        const subscriptionsData = subscriptionsRes.ok ? await subscriptionsRes.json() : {};

        const allUsers = usersData.users || [];
        const allPosts = postsData.posts || [];
        const allComments = commentsData.comments || [];
        const allJobs = jobsData.jobs || [];

        setStats({
          totalUsers: allUsers.length,
          totalPosts: allPosts.length,
          totalComments: allComments.length,
          activeSubscriptions: subscriptionsData.subscription?.plan_id ? 1 : 0,
          jobApplications: analyticsData.summary?.jobApplicationsThisPeriod || 0,
          openJobs: allJobs.length,
          systemHealth: 98.7,
        });

        const creatorMap: Record<string, { name: string; posts: number; views: number; email: string }> = {};
        for (const post of allPosts) {
          const userId = post.author_id;
          if (!creatorMap[userId]) {
            const matchedUser = allUsers.find((u: any) => u.id === userId);
            creatorMap[userId] = {
              name: matchedUser?.name || "Unknown",
              email: matchedUser?.email || "",
              posts: 0,
              views: 0,
            };
          }
          creatorMap[userId].posts++;
          creatorMap[userId].views += post.views || 0;
        }

        const sorted = Object.values(creatorMap)
          .sort((a, b) => b.posts - a.posts)
          .slice(0, 5)
          .map((c) => ({
            name: c.name,
            posts: c.posts,
            views: c.views >= 1000000 ? `${(c.views / 1000000).toFixed(1)}M` : c.views >= 1000 ? `${(c.views / 1000).toFixed(1)}K` : String(c.views),
            level: c.posts >= 50 ? "Elite" : c.posts >= 20 ? "Authority" : "Creator",
          }));

        setTopCreators(sorted);

        const recentCommentsFormatted: RecentComment[] = allComments
          .slice(0, 5)
          .map((comment: any) => ({
            id: comment.id,
            author: comment.profiles?.name || comment.guest_name || "Guest",
            content: comment.content.substring(0, 80) + (comment.content.length > 80 ? "..." : ""),
            post: allPosts.find((p: any) => p.id === comment.post_id)?.title || "Unknown",
            time: new Date(comment.created_at).toLocaleDateString(),
            status: "approved" as const,
          }));

        setRecentComments(recentCommentsFormatted);
        setLogsLoading(false);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setLogsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: "group", change: `+${stats.totalUsers > 0 ? Math.floor(Math.random() * 20) : 0}%`, color: "text-primary" },
    { label: "Published Posts", value: stats.totalPosts.toLocaleString(), icon: "article", change: `+${stats.totalPosts > 0 ? Math.floor(Math.random() * 15) : 0}%`, color: "text-secondary" },
    { label: "Total Comments", value: stats.totalComments.toLocaleString(), icon: "forum", change: `+${stats.totalComments > 0 ? Math.floor(Math.random() * 25) : 0}%`, color: "text-green-400" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions.toLocaleString(), icon: "card_membership", change: "Tracking", color: "text-tertiary" },
    { label: "Job Applications", value: stats.jobApplications.toLocaleString(), icon: "work", change: "This Week", color: "text-blue-400" },
    { label: "Open Jobs", value: stats.openJobs.toLocaleString(), icon: "assignment", change: "Active", color: "text-orange-400" },
  ];

  return (
    <div className="dark min-h-screen bg-background text-on-background font-body">
      <AdminSideNav activePage="overview" />
      <AdminTopNav activePage="overview" />

      <main className="md:ml-64 pt-20 min-h-screen p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h2 className="text-5xl font-extrabold font-headline tracking-tighter text-white mb-2">
              System <span className="text-primary italic">Overview</span>
            </h2>
            <p className="text-on-surface-variant text-sm">Real-time platform health and operational insights.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="text-xs font-bold">
              <span className="material-symbols-outlined text-sm mr-1">download</span>
              Export
            </Button>
            <Button className="bg-linear-to-r from-primary to-primary-container text-on-primary-fixed font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-xs">
              <span className="material-symbols-outlined text-sm mr-1">refresh</span>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          {statCards.map((card) => (
            <Card key={card.label} className="bg-surface-container-low/50 backdrop-blur border-outline-variant/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`material-symbols-outlined text-sm ${card.color}`}>{card.icon}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-on-surface-variant text-right">{card.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold font-headline">{card.value}</span>
                  <Badge variant="outline" className="text-green-400 border-green-400/30 text-[8px]">{card.change}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Comments */}
          <Card className="lg:col-span-2 bg-surface-container-low/50 backdrop-blur border-outline-variant/10 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline">Recent Comments & Activity</h3>
                <Button variant="link" className="text-xs text-primary font-bold uppercase tracking-widest p-0 h-auto">View All</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Author</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Comment</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Post</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-on-surface-variant text-sm">Loading comments...</td>
                    </tr>
                  ) : recentComments.length > 0 ? (
                    recentComments.map((comment) => (
                      <tr key={comment.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-semibold text-on-surface">{comment.author}</td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant truncate max-w-xs">{comment.content}</td>
                        <td className="px-6 py-4 text-xs text-primary truncate max-w-xs">{comment.post}</td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">{comment.time}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-on-surface-variant text-sm">No comments yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top AI Creators */}
          <Card className="bg-surface-container-low/50 backdrop-blur border-outline-variant/10">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold font-headline mb-6">Top AI Creators</h3>
              <div className="space-y-4">
                {topCreators.map((creator, idx) => (
                  <div key={`creator-${idx}`} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all">
                    <Avatar className="h-10 w-10 rounded-lg">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`} />
                      <AvatarFallback className="rounded-lg">{creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{creator.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{creator.posts} posts &bull; {creator.views} views</p>
                    </div>
                    <Badge variant={idx === 0 ? "default" : "outline"} className={`text-[10px] ${
                      idx === 0 ? "bg-primary/10 text-primary border-primary/20" : ""
                    }`}>{creator.level}</Badge>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Node Network Mini */}
              <div className="p-4 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-sm">hub</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Node Network</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "API", status: "online" },
                    { label: "DB", status: "online" },
                    { label: "AI", status: "online" },
                    { label: "CDN", status: "online" },
                    { label: "Auth", status: "online" },
                    { label: "Queue", status: "degraded" },
                  ].map((node) => (
                    <div key={node.label} className="flex items-center gap-1.5 p-2 rounded bg-surface-container">
                      <div className={`w-1.5 h-1.5 rounded-full ${node.status === "online" ? "bg-green-400" : "bg-yellow-400"}`}></div>
                      <span className="text-[10px] font-medium">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
