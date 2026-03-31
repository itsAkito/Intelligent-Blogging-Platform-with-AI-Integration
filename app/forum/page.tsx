"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  slug: string;
  topic_count: number;
  post_count: number;
}

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  is_pinned: boolean;
  is_solved: boolean;
  is_locked: boolean;
  reply_count: number;
  like_count: number;
  view_count: number;
  tags: string[];
  last_reply_at: string;
  created_at: string;
  forum_categories?: {
    name: string;
    slug: string;
    gradient: string;
    icon: string;
  };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ForumPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [recentTopics, setRecentTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, topicsRes] = await Promise.all([
          fetch("/api/forum/categories"),
          fetch("/api/forum/topics?limit=10&sort=latest"),
        ]);
        const catsData = catsRes.ok ? await catsRes.json() : {};
        const topicsData = topicsRes.ok ? await topicsRes.json() : {};
        setCategories(catsData.categories || []);
        setRecentTopics(topicsData.topics || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = search
    ? recentTopics.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : recentTopics;

  return (
    <div className="min-h-screen text-on-background" style={{background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(236,72,153,0.07) 0%, transparent 55%), hsl(var(--background))"}}>
      <NavBar />

      {/* Hero banner */}
      <section className="relative overflow-hidden pt-24 pb-16 px-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-125 h-75 bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-100 h-62.5 bg-secondary/6 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs font-bold px-3 py-1">
            <span className="material-symbols-outlined text-xs mr-1">forum</span>
            Community Forum
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter mb-4">
            Ask. Answer.{" "}
            <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto mb-8">
            Join the community forum to share knowledge, ask questions, and connect with{" "}
            thousands of AI enthusiasts, developers, and career builders.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {isAuthenticated ? (
              <Button
                className="bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                onClick={() => router.push("/forum/new")}
              >
                <span className="material-symbols-outlined text-sm mr-1">add</span>
                Start a Discussion
              </Button>
            ) : (
              <Button
                className="bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                onClick={() => router.push("/auth?next=%2Fforum")}
              >
                Join the Forum
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/community")}>
              <span className="material-symbols-outlined text-sm mr-1">groups</span>
              Community Feed
            </Button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[{label:"Categories",value:categories.length,icon:"category",color:"rgba(99,102,241,0.12)",border:"rgba(99,102,241,0.25)"},{label:"Discussions",value:recentTopics.length>0?`${recentTopics.length}+`:"0",icon:"chat_bubble",color:"rgba(139,92,246,0.12)",border:"rgba(139,92,246,0.25)"},{label:"Members",value:"120K+",icon:"group",color:"rgba(16,185,129,0.10)",border:"rgba(16,185,129,0.22)"},{label:"Daily Active",value:"4.2K+",icon:"trending_up",color:"rgba(236,72,153,0.10)",border:"rgba(236,72,153,0.22)"}].map((stat)=>(
            <Card key={stat.label} className="text-center hover:-translate-y-0.5 transition-all" style={{background:stat.color,border:`1px solid ${stat.border}`}}>
              <CardContent className="p-4">
                <span className="material-symbols-outlined text-primary text-2xl block mb-1">{stat.icon}</span>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs text-on-surface-variant">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories Grid */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold font-headline mb-6">
            Browse Categories
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/forum/category/${cat.slug}`}>
                  <Card className="group relative overflow-hidden border-white/10 bg-white/4 hover:bg-white/8 hover:border-white/20 transition-all duration-300 cursor-pointer h-full hover:scale-[1.02] hover:shadow-2xl">
                    {/* Gradient accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${cat.gradient}`} />
                    {/* Background gradient glow */}
                    <div className={`absolute -top-8 -right-8 w-32 h-32 bg-linear-to-br ${cat.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                    <CardContent className="p-5 relative">
                      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${cat.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                        <span className="material-symbols-outlined text-white text-lg">{cat.icon}</span>
                      </div>
                      <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                        {cat.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">forum</span>
                          {cat.topic_count} topics
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Discussions */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold font-headline">Recent Discussions</h2>
            <Input
              placeholder="Search discussions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-white/4 border-white/10"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="bg-white/4 border-white/10">
              <CardContent className="p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3 block">forum</span>
                <p className="text-on-surface-variant">
                  {search
                    ? "No discussions match your search."
                    : "No discussions yet. Be the first to start a conversation!"}
                </p>
                {isAuthenticated && !search && (
                  <Button
                    className="mt-4 bg-primary text-on-primary"
                    onClick={() => router.push("/forum/new")}
                  >
                    Start a Discussion
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((topic) => (
                <Link key={topic.id} href={`/forum/topic/${topic.id}`}>
                  <Card className="group bg-white/4 border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-secondary shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                          {topic.author_avatar ? (
                            <Image src={topic.author_avatar} alt={topic.author_name} width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            topic.author_name?.charAt(0)?.toUpperCase() || "U"
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {topic.is_pinned && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-[9px]">
                                <span className="material-symbols-outlined text-[9px] mr-0.5">push_pin</span>
                                Pinned
                              </Badge>
                            )}
                            {topic.is_solved && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[9px]">
                                <span className="material-symbols-outlined text-[9px] mr-0.5">check_circle</span>
                                Solved
                              </Badge>
                            )}
                            {topic.is_locked && (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px]">
                                <span className="material-symbols-outlined text-[9px] mr-0.5">lock</span>
                                Locked
                              </Badge>
                            )}
                            {topic.forum_categories && (
                              <Badge className={`bg-linear-to-r ${topic.forum_categories.gradient} text-white text-[9px] border-0`}>
                                {topic.forum_categories.name}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">
                            {topic.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant line-clamp-1 mb-2">
                            {topic.content}
                          </p>

                          <div className="flex items-center gap-4 text-[10px] text-on-surface-variant flex-wrap">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">person</span>
                              {topic.author_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">chat_bubble_outline</span>
                              {topic.reply_count} replies
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">favorite_outline</span>
                              {topic.like_count} likes
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">visibility</span>
                              {topic.view_count} views
                            </span>
                            <span className="ml-auto">{timeAgo(topic.last_reply_at || topic.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => router.push("/forum/all")}>
                  View All Discussions
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
