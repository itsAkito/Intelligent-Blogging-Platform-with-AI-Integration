"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/NavBar";

const Footer = dynamic(() => import("@/components/Footer"));

interface FeaturedPost {
  id: string;
  title: string;
  slug?: string;
  excerpt: string;
  topic?: string;
  category?: string;
  cover_image_url?: string;
  profiles?: { id: string; name: string; avatar_url: string };
  created_at: string;
  views: number;
}

interface CommunityReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  postTitle?: string;
  postSlug?: string;
  author: {
    name: string;
    avatar_url?: string;
  };
}

interface PublicStats {
  display: {
    activeCreators: string;
    syntheticPosts: string;
    monthlyReads: string;
    industryMentors: string;
  };
}

interface ResearchItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  category: string;
  publishedAt: string;
}

interface ForumTopicPreview {
  id: string;
  title: string;
  reply_count: number;
  like_count: number;
  forum_categories?: {
    name: string;
  };
}

export default function Home() {
  useScrollReveal();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [recentReviews, setRecentReviews] = useState<CommunityReview[]>([]);
  const [researchFeed, setResearchFeed] = useState<ResearchItem[]>([]);
  const [worldNews, setWorldNews] = useState<ResearchItem[]>([]);
  const [forumTopics, setForumTopics] = useState<ForumTopicPreview[]>([]);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [totalPostCount, setTotalPostCount] = useState<number | null>(null);

  const fetchFeaturedReview = useCallback(async () => {
    try {
      const res = await fetch("/api/community/reviews?limit=3", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRecentReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to fetch featured review:", err);
    }
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/posts?limit=3&published=true");
        if (res.ok) {
          const data = await res.json();
          const posts = data.posts || data || [];
          setFeaturedPosts(posts);
          // Grab total count if returned
          if (data.total != null) setTotalPostCount(data.total);
        }
      } catch (err) {
        console.error("Failed to fetch featured posts:", err);
      }
    };
    const fetchPublicStats = async () => {
      try {
        const res = await fetch("/api/public/stats", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPublicStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch public stats:", err);
      }
    };
    const fetchResearchFeed = async () => {
      try {
        const res = await fetch("/api/innovation/news", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const researchItems = (data.researchNews || data.items || []) as ResearchItem[];
        const worldItems = (data.worldNews || []) as ResearchItem[];
        setResearchFeed(researchItems.slice(0, 6));
        setWorldNews(worldItems.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch research feed:", err);
      }
    };
    const fetchForumTopics = async () => {
      try {
        const res = await fetch("/api/forum/topics?limit=6&sort=latest", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setForumTopics((data.topics || []).slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch forum topics:", err);
      }
    };
    fetchFeatured();
    fetchFeaturedReview();
    fetchPublicStats();
    fetchResearchFeed();
    fetchForumTopics();
  }, [fetchFeaturedReview]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchFeaturedReview();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchFeaturedReview();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchFeaturedReview]);

  useEffect(() => setMounted(true), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/community?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus("success");
        setNewsletterMessage("You're subscribed! Welcome aboard.");
        setNewsletterEmail("");
      } else {
        setNewsletterStatus("error");
        setNewsletterMessage(data.error || "Failed to subscribe.");
      }
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("Something went wrong. Try again.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen text-on-background" style={{background: 'radial-gradient(ellipse at 15% 20%, rgba(59,130,246,0.18) 0%, transparent 48%), radial-gradient(ellipse at 85% 10%, rgba(139,92,246,0.16) 0%, transparent 45%), radial-gradient(ellipse at 50% 90%, rgba(16,185,129,0.14) 0%, transparent 50%), radial-gradient(ellipse at 90% 70%, rgba(236,72,153,0.10) 0%, transparent 40%), #0e0e0e'}}>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-8 pt-28 pb-20">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-[46%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/10 rounded-full blur-[120px]"></div>
            <div className="absolute top-24 left-[16%] w-72 h-72 rounded-full bg-emerald-500/12 blur-[100px]"></div>
            <div className="absolute bottom-24 right-[14%] w-80 h-80 rounded-full bg-blue-500/14 blur-[110px]"></div>
            <div className="absolute top-10 right-[8%] w-60 h-60 rounded-full bg-violet-500/10 blur-[90px]"></div>
            <div className="absolute bottom-10 left-[8%] w-56 h-56 rounded-full bg-pink-500/08 blur-[90px]"></div>
            {/* Subtle grid lines */}
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(255,255,255,0.5) 48px,rgba(255,255,255,0.5) 49px),repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(255,255,255,0.5) 48px,rgba(255,255,255,0.5) 49px)" }}
            />
          </div>

          <div className="text-center max-w-4xl reveal-on-scroll">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container-high/80 border border-outline-variant/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-8">
              <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              The Future of Editorial Excellence
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold font-headline leading-[1.05] tracking-tighter mb-6">
              Elevate Your Blog and
              <br />
              <span className="text-gradient">Career with AI</span>
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
              A premium digital ecosystem where generative intelligence meets professional journalism. Redefining how the world creates, learns, and builds careers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="px-8 py-3.5 h-auto bg-linear-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                <Link href={mounted && isAuthenticated ? "/pricing" : "/auth?next=%2Fpricing"}>Get Started Free</Link>
              </Button>
              <Button asChild variant="outline" className="px-8 py-3.5 h-auto font-bold rounded-xl">
                <Link href="/community">Join Community</Link>
              </Button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-12 max-w-xl mx-auto w-full">
              <div className="relative group">
                {/* Outer animated glow */}
                <div className="absolute -inset-1 bg-linear-to-r from-primary via-secondary to-tertiary rounded-full opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 blur-lg transition-all duration-700"></div>
                {/* Inner border glow */}
                <div className="absolute -inset-px bg-linear-to-r from-primary/40 via-secondary/30 to-tertiary/40 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-400"></div>
                {/* Search pill */}
                <div className="relative flex items-center bg-surface-container-high/80 backdrop-blur-xl border border-outline-variant/15 rounded-full overflow-hidden focus-within:border-transparent transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-primary/10">
                  <div className="pl-5 pr-1 flex items-center">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-xl group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                  </div>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics, posts & creators..."
                    className="flex-1 bg-transparent border-none px-3 py-4 text-sm text-on-surface placeholder:text-on-surface-variant/35 outline-none font-medium tracking-wide focus-visible:ring-0 shadow-none h-auto"
                  />
                  <Button
                    type="submit"
                    className="mr-1.5 px-5 py-2.5 h-auto bg-linear-to-r from-primary to-primary-container text-on-primary-fixed font-extrabold text-xs rounded-full hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    Search
                  </Button>
                </div>
              </div>
              {/* Trending Tags */}
              <div className="flex gap-2 mt-5 justify-center flex-wrap">
                <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em] self-center mr-1">Trending</span>
                {["AI & ML", "Career", "Engineering", "Design", "Writing"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:border-primary/50 hover:text-primary hover:bg-primary/10 hover:shadow-sm hover:shadow-primary/10 active:scale-95 transition-all duration-200"
                    onClick={() => { setSearchQuery(tag); router.push(`/community?search=${encodeURIComponent(tag)}`); }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </form>
          </div>

          {/* Stats Grid */}
          <div className="w-full max-w-5xl grid grid-cols-2 lg:grid-cols-4 gap-4 px-2 mt-16 reveal-on-scroll">
            {[
              { value: publicStats?.display.activeCreators || "0", label: "Active Creators", gradient: "from-blue-500/20 to-cyan-500/10", border: "hover:border-blue-500/40", glow: "hover:shadow-blue-500/15" },
              { value: publicStats?.display.syntheticPosts || "0", label: "Published Posts", gradient: "from-violet-500/20 to-purple-500/10", border: "hover:border-violet-500/40", glow: "hover:shadow-violet-500/15" },
              { value: publicStats?.display.monthlyReads || "0", label: "Monthly Reads", gradient: "from-emerald-500/20 to-teal-500/10", border: "hover:border-emerald-500/40", glow: "hover:shadow-emerald-500/15" },
              { value: publicStats?.display.industryMentors || "0", label: "Industry Mentors", gradient: "from-pink-500/20 to-rose-500/10", border: "hover:border-pink-500/40", glow: "hover:shadow-pink-500/15" },
            ].map((stat) => (
              <Card key={stat.label} className={`relative overflow-hidden backdrop-blur-xl border border-white/10 text-center ${stat.border} hover:bg-white/8 transition-all duration-300 group shadow-lg shadow-black/20 hover:shadow-xl ${stat.glow} hover:-translate-y-0.5`}>
                <div className={`absolute inset-0 bg-linear-to-br ${stat.gradient} opacity-60`} />
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
                <CardContent className="relative p-6">
                  <span className="text-3xl sm:text-4xl font-extrabold font-headline block mb-2 group-hover:text-primary transition-colors">{stat.value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">{stat.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Stories */}
        <section className="py-20 px-4 sm:px-8" style={{background: 'linear-gradient(165deg, rgba(16,185,129,0.07) 0%, rgba(14,14,14,0.15) 38%, rgba(59,130,246,0.08) 80%, rgba(139,92,246,0.06) 100%)'}}>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4 reveal-on-scroll">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-2">Curated Content</span>
                <h2 className="text-4xl sm:text-5xl font-extrabold font-headline tracking-tighter">Featured Stories</h2>
              </div>
              <Button asChild variant="link" className="text-primary p-0 h-auto">
                <Link href="/community">
                  Explore All Stories <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 reveal-on-scroll">
              {featuredPosts.length > 0 ? (
                <>
                  {/* Card 1 - Large */}
                  <Link href={`/blog/${featuredPosts[0].slug || featuredPosts[0].id}`} className="relative group overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/10 h-105 hover:border-primary/20 transition-all block">
                    {featuredPosts[0].cover_image_url && (
                      <Image
                        src={featuredPosts[0].cover_image_url}
                        alt={featuredPosts[0].title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                      {featuredPosts[0].topic && (
                        <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider mb-4">{featuredPosts[0].topic}</Badge>
                      )}
                      {featuredPosts[0].category && (
                        <Badge variant="outline" className="ml-2 bg-white/10 border-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-4">{featuredPosts[0].category}</Badge>
                      )}
                      <h3 className="text-2xl font-bold font-headline mb-2 text-white">{featuredPosts[0].title}</h3>
                      <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{featuredPosts[0].excerpt}</p>
                      <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                        {featuredPosts[0].profiles && (
                          <>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={featuredPosts[0].profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${featuredPosts[0].profiles.name}`} />
                              <AvatarFallback>{featuredPosts[0].profiles.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-white text-xs">{featuredPosts[0].profiles.name}</span>
                              <span className="block text-[10px] text-on-surface-variant">{new Date(featuredPosts[0].created_at).toLocaleDateString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Right column - stacked cards */}
                  <div className="flex flex-col gap-6">
                    {featuredPosts.slice(1, 3).map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="relative group overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/10 h-50 hover:border-primary/20 transition-all block">
                        {post.cover_image_url && (
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-linear-to-r from-black/80 to-transparent z-10"></div>
                        <div className="absolute inset-0 p-6 z-20 flex flex-col justify-end">
                          {post.topic && (
                            <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider mb-3 w-fit">{post.topic}</Badge>
                          )}
                          {post.category && (
                            <Badge variant="outline" className="ml-2 bg-white/10 border-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-3 w-fit">{post.category}</Badge>
                          )}
                          <h3 className="text-xl font-bold font-headline text-white">{post.title}</h3>
                          {post.profiles && (
                            <p className="text-xs text-on-surface-variant mt-1">{post.profiles.name} • {new Date(post.created_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                    {featuredPosts.length < 3 && (
                      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/10 h-50 flex items-center justify-center">
                        <p className="text-on-surface-variant text-sm">More stories coming soon</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center py-16">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-4 block">article</span>
                  <p className="text-on-surface-variant">No stories yet. Be the first to publish!</p>
                  <Button asChild variant="link" className="mt-4 text-primary">
                    <Link href="/editor">Create a Post</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Logged-in User Insights Bar */}
        {mounted && isAuthenticated && (
          <div className="px-4 sm:px-8 pb-6">
            <div className="max-w-7xl mx-auto">
              <div className="rounded-2xl border border-white/8 overflow-hidden" style={{background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.10) 50%, rgba(16,185,129,0.08) 100%)'}}>
                <div className="px-6 py-4 flex flex-wrap items-center gap-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Your Library</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>article</span>
                    <span className="text-sm font-bold text-white">{totalPostCount ?? featuredPosts.length} Blog Posts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>science</span>
                    <span className="text-sm font-bold text-white">{researchFeed.length} Research Papers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-violet-400 text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>newspaper</span>
                    <span className="text-sm font-bold text-white">Live News Feed</span>
                  </div>
                  <div className="ml-auto flex gap-3">
                    <Button asChild size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 text-xs">
                      <Link href="/community">All Posts</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 text-xs">
                      <Link href="/innovation">Research</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signal Deck: Research, News, Forum */}
        <section className="px-4 sm:px-8 pb-10">
          <div className="max-w-7xl mx-auto">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8"
              style={{
                background:
                  "linear-gradient(135deg, rgba(70,95,82,0.22) 0%, rgba(45,58,53,0.26) 28%, rgba(28,34,33,0.85) 54%, rgba(20,25,25,0.92) 100%)",
              }}
            >
              <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-green-400/22 blur-3xl" />
              <div className="absolute inset-x-10 top-[46%] h-24 -translate-y-1/2 rounded-full bg-zinc-200/10 blur-2xl" />
              <div className="absolute -right-16 -bottom-18 h-72 w-72 rounded-full bg-green-400/8 blur-3xl" />

              <div className="relative">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                  Live Discovery Deck
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tighter text-white">
                  World Research, News, And Forum Momentum
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-zinc-200/75">
                  Fresh cards stream from global research papers, world AI news, and active forum discussions. Open any card to jump directly into the source.
                </p>

                <div className="mt-7 grid grid-cols-1 xl:grid-cols-12 gap-4">
                  <div className="xl:col-span-4 rounded-2xl border border-zinc-300/15 bg-zinc-900/45 p-5 backdrop-blur">
                    <p className="text-xs font-semibold text-emerald-200">Quick Access</p>
                    <div className="mt-4 grid gap-3">
                      {[
                        { href: "/innovation", icon: "science", title: "Research Papers", count: researchFeed.length, hint: "Latest publications and innovation signals" },
                        { href: "/innovation", icon: "newspaper", title: "World News", count: worldNews.length, hint: "Global AI and science updates" },
                        { href: "/forum", icon: "forum", title: "Forum Topics", count: forumTopics.length, hint: "Live community threads and replies" },
                      ].map((card) => (
                        <Link
                          key={card.title}
                          href={card.href}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-800/35 px-4 py-3 hover:border-emerald-300/40 hover:bg-zinc-700/35 transition-all"
                        >
                          <div className="absolute inset-0 bg-linear-to-r from-emerald-300/15 via-zinc-200/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative flex items-start gap-3">
                            <span className="material-symbols-outlined text-emerald-200 text-[18px] mt-0.5">{card.icon}</span>
                            <div>
                              <p className="text-sm font-bold text-white">{card.title}</p>
                              <p className="text-[11px] text-zinc-300/80">{card.count} cards live now</p>
                              <p className="text-[11px] text-zinc-400 mt-1">{card.hint}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {researchFeed.slice(0, 3).map((item) => (
                      <Link
                        key={`research-${item.id}`}
                        href={`/innovation?tab=research&story=${encodeURIComponent(item.id)}`}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/35 p-4 hover:border-emerald-300/40 transition-all"
                      >
                        <div className="absolute inset-0 bg-linear-to-br from-emerald-400/20 via-zinc-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="relative text-[10px] uppercase tracking-[0.16em] text-emerald-200 font-semibold">Research</p>
                        <h3 className="relative mt-2 text-sm font-bold text-white line-clamp-2">{item.title}</h3>
                        <p className="relative mt-2 text-xs text-zinc-300/80 line-clamp-3">{item.summary}</p>
                      </Link>
                    ))}

                    {worldNews.slice(0, 3).map((item) => (
                      <a
                        key={`news-${item.id}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/35 p-4 hover:border-emerald-300/35 transition-all"
                      >
                        <div className="absolute inset-0 bg-linear-to-br from-zinc-200/12 via-emerald-200/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="relative text-[10px] uppercase tracking-[0.16em] text-zinc-200 font-semibold">World News</p>
                        <h3 className="relative mt-2 text-sm font-bold text-white line-clamp-2">{item.title}</h3>
                        <p className="relative mt-2 text-xs text-zinc-300/80 line-clamp-3">{item.summary}</p>
                      </a>
                    ))}

                    {forumTopics.slice(0, 3).map((topic) => (
                      <Link
                        key={`forum-${topic.id}`}
                        href={`/forum/topic/${topic.id}`}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/35 p-4 hover:border-emerald-300/35 transition-all"
                      >
                        <div className="absolute inset-0 bg-linear-to-br from-green-400/14 via-zinc-300/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="relative text-[10px] uppercase tracking-[0.16em] text-green-200 font-semibold">
                          {topic.forum_categories?.name || "Forum Topic"}
                        </p>
                        <h3 className="relative mt-2 text-sm font-bold text-white line-clamp-2">{topic.title}</h3>
                        <p className="relative mt-2 text-xs text-zinc-300/80">
                          {topic.reply_count} replies • {topic.like_count} likes
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Theme Showcase */}
        <section className="py-20 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto reveal-on-scroll">
            <div className="relative overflow-hidden border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(5,20,12,0.95),rgba(8,38,22,0.85)_40%,rgba(12,30,35,0.78))]  p-6 sm:p-10">
              <div className="absolute -top-20 right-8 w-64 h-64 rounded-full bg-emerald-400/8 blur-3xl" />
              <div className="absolute -bottom-16 left-16 w-56 h-56 rounded-full bg-teal-400/6 blur-3xl" />

              <div className="relative flex items-center justify-between gap-4 flex-wrap mb-8">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.25em] text-emerald-300/90 uppercase block mb-2">Theme Gallery</span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tighter text-white">200+ Blog Themes Across 20 Categories</h2>
                  <p className="text-sm text-emerald-100/60 mt-2 max-w-2xl">
                    Professional editorial palettes for every niche — from business to photography, code to culinary. Pick a theme and start writing instantly.
                  </p>
                </div>
                <Button asChild variant="outline" className="border-emerald-300/30 text-emerald-100 hover:bg-emerald-300/10">
                  <Link href="/blog-themes">View All Themes →</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative">
                {[
                  { name: "Sahara Executive", cat: "Business", desc: "Warm tones for corporate storytelling and thought leadership.", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop&q=80" },
                  { name: "Neon Circuit", cat: "Technology", desc: "Futuristic neon palette for tech blogs and startup chronicles.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=340&fit=crop&q=80" },
                  { name: "Cosmos", cat: "Science", desc: "Deep space aesthetic for research papers and scientific discovery.", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=440&fit=crop&q=80" },
                  { name: "Dark Gallery", cat: "Photography", desc: "Moody gallery layout to showcase visual portfolios and photo essays.", image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=360&fit=crop&q=80" },
                  { name: "Dracula Code", cat: "Code Space", desc: "Syntax-highlighted dark theme for developer tutorials and docs.", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=380&fit=crop&q=80" },
                  { name: "Zen Garden", cat: "Wellness", desc: "Serene greens and soft tones for mindfulness and health content.", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=480&fit=crop&q=80" },
                  { name: "Fire Kitchen", cat: "Culinary", desc: "Bold warm palette for recipes, food reviews, and culinary arts.", image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=340&fit=crop&q=80" },
                  { name: "Compass", cat: "Travel", desc: "Adventure-ready layout for travel journals and destination guides.", image: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&h=420&fit=crop&q=80" },
                  { name: "Ledger Noir", cat: "Finance", desc: "Clean, data-driven layout for fintech analysis and market commentary.", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop&q=80" },
                  { name: "Canvas Bloom", cat: "Art & Design", desc: "Creative palette for digital art showcases and design case studies.", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=440&fit=crop&q=80" },
                  { name: "Scholar Press", cat: "Education", desc: "Academic-focused theme for courses, tutorials, and learning resources.", image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=380&fit=crop&q=80" },
                  { name: "Pulse Beat", cat: "Music", desc: "Rhythm-inspired layout for album reviews, playlists, and artist spotlights.", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=420&fit=crop&q=80" },
                  { name: "Green Thread", cat: "Sustainability", desc: "Eco-conscious design for environmental stories and green innovation.", image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=460&fit=crop&q=80" },
                ].map((theme) => (
                  <div key={theme.name} className="group relative block overflow-hidden border border-white/10 bg-black/30 hover:border-emerald-400/35 hover:bg-black/45 transition-all">
                    <div className="h-44 overflow-hidden relative">
                      <Image
                        src={theme.image}
                        alt={theme.name}
                        width={400}
                        height={440}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-transparent" />
                      {/* Hover overlay with description + View Detail */}
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-xs text-emerald-100/90 leading-relaxed mb-4">{theme.desc}</p>
                        <Link
                          href="/blog-themes"
                          className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/50 text-emerald-300 rounded-md hover:bg-emerald-400/20 transition-colors"
                        >
                          View Detail
                        </Link>
                      </div>
                    </div>
                    <div className="absolute bottom-8 left-0 right-0 p-3 pointer-events-none">
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-300/80 block mb-0.5">{theme.cat}</span>
                      <span className="text-xs font-bold text-white leading-tight">{theme.name}</span>
                    </div>
                    <div className="border-t border-white/10 px-3 py-2 text-[11px] text-emerald-100/75 bg-black/45">
                      Open this theme in editor
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section id="newsletter" className="py-20 sm:py-28 px-4 sm:px-8 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_45%),linear-gradient(165deg,rgba(59,130,246,0.08),rgba(0,0,0,0))]">
          <div className="max-w-3xl mx-auto text-center reveal-on-scroll">
            <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase block mb-4">Stay Informed</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold font-headline tracking-tighter mb-4">
              Join Our <span className="text-gradient">Newsletter</span>
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-lg mx-auto">
              Get the latest AI-powered editorial insights, career tips, and platform updates delivered straight to your inbox. No spam, ever.
            </p>

            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 h-auto rounded-xl bg-surface-container-low border-outline-variant/20 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus-visible:ring-primary/50"
                required
              />
              <Button
                type="submit"
                disabled={newsletterStatus === "loading"}
                className="px-8 py-3.5 h-auto bg-linear-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl text-sm hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
              >
                {newsletterStatus === "loading" ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>

            {newsletterStatus === "success" && (
              <p className="mt-4 text-green-400 text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {newsletterMessage}
              </p>
            )}
            {newsletterStatus === "error" && (
              <p className="mt-4 text-error text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {newsletterMessage}
              </p>
            )}

            <div className="mt-8 flex justify-center gap-8 text-[10px] uppercase tracking-wider text-on-surface-variant">
              <Badge variant="outline" className="border-transparent gap-2"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> Free forever</Badge>
              <Badge variant="outline" className="border-transparent gap-2"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> Weekly digest</Badge>
              <Badge variant="outline" className="border-transparent gap-2"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> Unsubscribe anytime</Badge>
            </div>
          </div>
        </section>

        {/* Beyond a Platform - Career Engine */}
        <section className="py-20 sm:py-28 px-4 sm:px-8 bg-[linear-gradient(180deg,rgba(59,130,246,0.06),rgba(16,185,129,0.04)_45%,transparent)]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start reveal-on-scroll">
              <div>
                <h2 className="text-4xl sm:text-5xl font-extrabold font-headline tracking-tighter leading-[1.1] mb-8">
                  Beyond a Platform.<br />
                  A <span className="text-primary">Career Engine.</span>
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">groups</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Elite Peer Network</h4>
                      <p className="text-sm text-on-surface-variant">Connect with senior editors and tech leads from the world&apos;s top firms.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">AI-Powered Career Tracks</h4>
                      <p className="text-sm text-on-surface-variant">Personalized roadmaps generated from your writing style and audience engagement.</p>
                    </div>
                  </div>
                </div>

                <Button asChild variant="outline" className="mt-8 px-8 py-3.5 h-auto border-primary text-primary font-bold rounded-xl hover:bg-primary/10">
                  <Link href="/community">Join the Community</Link>
                </Button>
              </div>

              {/* Dynamic community review cards with curved/tilted layout */}
              <Card
                className="relative overflow-hidden bg-surface-container-low/55 backdrop-blur border-outline-variant/10"
                style={{
                  borderRadius: "56% 44% 52% 48% / 26% 32% 68% 74%",
                  transform: "rotate(-1.4deg)",
                }}
              >
                <div className="absolute -top-8 right-6 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-blue-400/10 blur-2xl" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16 rounded-lg">
                      <AvatarImage src={recentReviews[0]?.author?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Community"} />
                      <AvatarFallback className="rounded-lg">CM</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-white">{recentReviews[0]?.author?.name || "Community Member"}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-primary">Verified Community Review</p>
                    </div>
                  </div>
                  <blockquote className="text-on-surface-variant italic leading-relaxed mb-6">
                    &ldquo;{recentReviews[0]?.comment || "Community feedback will appear here as members post reviews."}&rdquo;
                  </blockquote>
                  <Separator className="mb-4" />
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-on-surface-variant">
                    <span>Reviewed {recentReviews[0]?.created_at ? new Date(recentReviews[0].created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                    <Badge variant="outline" className="text-amber-300 border-amber-400/30">
                      {"★".repeat(Math.max(1, Math.min(5, recentReviews[0]?.rating || 5)))}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {recentReviews.length > 1 && (
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {recentReviews.slice(1, 3).map((review) => (
                    <Card
                      key={review.id}
                      className="bg-surface-container-low/45 border-outline-variant/10 transition-transform"
                      style={{
                        borderRadius: "22% 78% 30% 70% / 63% 31% 69% 37%",
                        transform: review.id === recentReviews[1]?.id ? "rotate(1.6deg)" : "rotate(-1.1deg)",
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-white">{review.author?.name || 'Community Member'}</p>
                          <Badge variant="outline" className="text-[10px] border-amber-400/30 text-amber-300">{'★'.repeat(Math.max(1, Math.min(5, review.rating || 1)))}</Badge>
                        </div>
                        <p className="text-sm text-on-surface-variant line-clamp-3">{review.comment}</p>
                        {review.postSlug && (
                          <Link href={`/blog/${review.postSlug}`} className="mt-3 inline-block text-xs text-primary hover:underline">
                            Read: {review.postTitle || 'View post'}
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}