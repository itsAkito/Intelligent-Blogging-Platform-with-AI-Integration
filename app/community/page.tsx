"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import SideNavBar from "@/components/SideNavBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Share2 } from "lucide-react";

interface ApiPost {
  id: string;
  title: string;
  slug?: string;
  excerpt: string;
  views: number;
  likes_count: number;
  created_at: string;
  ai_generated: boolean;
  topic?: string;
  author_id?: string;
  cover_image_url?: string;
  profiles?: { id: string; name: string; avatar_url: string };
}

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<CommunityLoadingSkeleton />}>
        <CommunityContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function CommunityLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden lg:block w-64" />
        <main className="flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-5xl mx-auto w-full">
          <Skeleton className="h-12 w-72 mb-2 bg-surface-container" />
          <Skeleton className="h-5 w-96 mb-8 bg-surface-container" />
          <Skeleton className="h-10 w-full mb-8 bg-surface-container" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl bg-surface-container" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function CommunityContent() {
  const [apiPosts, setApiPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch) setSearchQuery(urlSearch);

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (urlSearch) params.set("search", urlSearch);
        const response = await fetch(`/api/posts?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setApiPosts(data.posts || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch community posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    router.push(`/community?${params.toString()}`);
  };

  const sortedPosts = [...apiPosts].sort((a, b) => {
    if (sortBy === "liked") return b.likes_count - a.likes_count;
    if (sortBy === "viewed") return b.views - a.views;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const trendingTopics = ["AI Writing", "Career Growth", "Tech Trends", "Productivity", "Design"];

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const newLiked = new Set(likedPosts);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      setLikedPosts(newLiked);
      
      // Call API to track like
      await fetch(`/api/blog/${postId}/like`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleShare = async (e: React.MouseEvent, post: ApiPost) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareText = `Check out "${post.title}" on AiBlog`;
    const shareUrl = `${window.location.origin}/blog/${post.slug || post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const options = [
        { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
        { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
        { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
        { name: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` },
        { name: 'Email', url: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(post.excerpt + '\n\n' + shareUrl)}` },
      ];
      
      // Show simple share menu (you can replace with a proper modal)
      const platform = prompt(`Share on:\n${options.map((o, i) => `${i + 1}. ${o.name}`).join('\n')}`);
      if (platform && options[parseInt(platform) - 1]) {
        window.open(options[parseInt(platform) - 1].url, '_blank');
      }
    }

    // Call API to track share
    try {
      await fetch(`/api/blog/${post.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'direct' })
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <SideNavBar activePage="community" />

        <main className="flex-1 lg:ml-64 pt-24 pb-20 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-headline text-4xl sm:text-5xl font-extrabold tracking-tighter text-on-surface">
                    Community<span className="text-gradient"> Feed</span>
                  </h1>
                  <p className="text-on-surface-variant mt-2 text-sm max-w-lg">
                    Discover insights, share knowledge, and connect with creators building the future.
                  </p>
                </div>
                <Link href="/editor">
                  <Button className="bg-linear-to-r from-primary to-primary-container text-on-primary-fixed rounded-full font-bold text-sm px-6 gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all">
                    <span className="material-symbols-outlined text-base">edit_note</span>
                    Write a Post
                  </Button>
                </Link>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative group mb-6">
                <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center bg-surface-container border border-outline-variant/20 rounded-xl overflow-hidden focus-within:border-primary/40 transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant pl-4 text-lg">search</span>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts by title, topic, or keyword..."
                    className="flex-1 border-0 bg-transparent text-sm py-3 text-on-surface placeholder:text-on-surface-variant/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="mr-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-on-primary font-semibold text-xs px-4 transition-all"
                  >
                    Search
                  </Button>
                </div>
              </form>

              {searchQuery && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  <span>Results for &ldquo;{searchQuery}&rdquo;</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSearchQuery(""); router.push("/community"); }}
                    className="text-primary text-xs h-auto p-0 hover:bg-transparent hover:underline"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Sort Tabs */}
              <Tabs value={sortBy} onValueChange={setSortBy}>
                <TabsList className="bg-surface-container border border-outline-variant/10 rounded-full p-1 h-auto">
                  <TabsTrigger value="latest" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm mr-1.5">schedule</span>
                    Latest
                  </TabsTrigger>
                  <TabsTrigger value="liked" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm mr-1.5">favorite</span>
                    Most Liked
                  </TabsTrigger>
                  <TabsTrigger value="viewed" className="rounded-full text-xs px-4 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm mr-1.5">visibility</span>
                    Most Viewed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Posts Column */}
              <div className="lg:col-span-2 space-y-5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="bg-surface-container border-outline-variant/10 rounded-2xl overflow-hidden">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full bg-surface-container-high" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-24 bg-surface-container-high" />
                            <Skeleton className="h-3 w-16 bg-surface-container-high" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-5 pb-3">
                        <Skeleton className="h-5 w-4/5 mb-2 bg-surface-container-high" />
                        <Skeleton className="h-4 w-full mb-1 bg-surface-container-high" />
                        <Skeleton className="h-4 w-2/3 bg-surface-container-high" />
                      </CardContent>
                      <CardFooter className="px-5 pb-5">
                        <Skeleton className="h-40 w-full rounded-xl bg-surface-container-high" />
                      </CardFooter>
                    </Card>
                  ))
                ) : sortedPosts.length > 0 ? (
                  sortedPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug || post.id}`} className="block group">
                      <Card className="bg-surface-container border-outline-variant/10 rounded-2xl overflow-hidden hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                        {/* Author Header */}
                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.name || post.author_id}`}
                                  alt={post.profiles?.name || "Author"}
                                />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {(post.profiles?.name || "A").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-on-surface">
                                  {post.profiles?.name || "Anonymous"}
                                </p>
                                <p className="text-[11px] text-on-surface-variant">
                                  {new Date(post.created_at).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric", year: "numeric"
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              {post.ai_generated && (
                                <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-[10px] font-bold">
                                  <span className="material-symbols-outlined text-[12px] mr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                  AI
                                </Badge>
                              )}
                              {post.topic && (
                                <Badge variant="outline" className="text-[10px] border-outline-variant/30 text-on-surface-variant">
                                  {post.topic}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {/* Content */}
                        <CardContent className="px-5 pb-3">
                          <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors leading-snug">
                            {post.title}
                          </h3>
                          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </CardContent>

                        {/* Cover Image */}
                        {post.cover_image_url && (
                          <div className="px-5 pb-3">
                            <div className="rounded-xl overflow-hidden">
                              <img
                                src={post.cover_image_url}
                                alt={post.title}
                                className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer Stats */}
                        <CardFooter className="px-5 py-4 border-t border-outline-variant/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleLike(e, post.id)}
                              className={`flex items-center gap-1.5 text-xs transition-colors rounded-lg px-2.5 py-1.5 ${
                                likedPosts.has(post.id)
                                  ? "text-red-500 bg-red-500/10"
                                  : "text-on-surface-variant hover:text-red-500 hover:bg-red-500/5"
                              }`}
                              title="Like this post"
                            >
                              <Heart
                                size={16}
                                className={likedPosts.has(post.id) ? "fill-red-500" : ""}
                              />
                              <span>{post.likes_count}</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant px-2.5 py-1.5">
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              <span>{post.views}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleShare(e, post)}
                            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors rounded-lg px-2.5 py-1.5 hover:bg-primary/5"
                            title="Share this post"
                          >
                            <Share2 size={16} />
                            <span className="hidden sm:inline">Share</span>
                          </button>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card className="bg-surface-container border-outline-variant/10 rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-20">
                      <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">forum</span>
                      </div>
                      <p className="text-on-surface-variant font-medium mb-2">No posts yet</p>
                      <p className="text-on-surface-variant/60 text-sm mb-6">Start sharing your insights with the community!</p>
                      <Link href="/editor">
                        <Button className="rounded-full bg-primary text-on-primary font-semibold text-sm px-6 gap-2">
                          <span className="material-symbols-outlined text-base">edit_note</span>
                          Create Your First Post
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6 hidden lg:block">
                {/* Trending Topics */}
                <Card className="bg-surface-container border-outline-variant/10 rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                      <h3 className="font-headline text-sm font-bold text-on-surface">Trending Topics</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {trendingTopics.map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="cursor-pointer border-outline-variant/20 text-on-surface-variant hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-xs py-1"
                          onClick={() => {
                            setSearchQuery(topic);
                            const params = new URLSearchParams({ search: topic });
                            router.push(`/community?${params.toString()}`);
                          }}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Pulse Insight */}
                <Card className="bg-linear-to-br from-surface-container to-secondary-container/10 border-secondary/10 rounded-2xl overflow-hidden relative group">
                  <div className="absolute -right-6 -top-6 w-28 h-28 bg-secondary/10 blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">AI Pulse</span>
                    </div>
                  </CardHeader>
                  <CardContent className="relative pb-5">
                    <p className="text-sm text-on-surface leading-relaxed mb-4">
                      Creators publishing 3+ AI-assisted articles saw a <span className="text-secondary font-bold">45% increase</span> in profile views.
                    </p>
                    <div className="h-1.5 w-full bg-outline-variant/10 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-linear-to-r from-secondary to-tertiary rounded-full" />
                    </div>
                  </CardContent>
                </Card>

                {/* Community Stats */}
                <Card className="bg-surface-container border-outline-variant/10 rounded-2xl">
                  <CardHeader className="pb-2">
                    <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">groups</span>
                      Community
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">Total Posts</span>
                      <span className="text-sm font-bold text-on-surface">{apiPosts.length}</span>
                    </div>
                    <Separator className="bg-outline-variant/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">AI Generated</span>
                      <span className="text-sm font-bold text-secondary">{apiPosts.filter(p => p.ai_generated).length}</span>
                    </div>
                    <Separator className="bg-outline-variant/10" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant">Total Views</span>
                      <span className="text-sm font-bold text-on-surface">{apiPosts.reduce((sum, p) => sum + p.views, 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Upgrade Card */}
                <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/10 rounded-2xl">
                  <CardContent className="p-5 text-center">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>
                    <h4 className="font-headline font-bold text-sm text-on-surface mb-1">Go Pro</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                      Advanced AI tools, analytics, and priority support.
                    </p>
                    <Link href="/pricing" className="block">
                      <Button className="w-full rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-all text-xs font-bold">
                        Upgrade Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
