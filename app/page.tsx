"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface FeaturedPost {
  id: string;
  title: string;
  slug?: string;
  excerpt: string;
  topic?: string;
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

export default function Home() {
  useScrollReveal();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [featuredReview, setFeaturedReview] = useState<CommunityReview | null>(null);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/posts?limit=3&published=true");
        if (res.ok) {
          const data = await res.json();
          setFeaturedPosts(data.posts || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch featured posts:", err);
      }
    };
    const fetchFeaturedReview = async () => {
      try {
        const res = await fetch("/api/community/reviews?limit=1");
        if (res.ok) {
          const data = await res.json();
          setFeaturedReview((data.reviews || [])[0] || null);
        }
      } catch (err) {
        console.error("Failed to fetch featured review:", err);
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
    fetchFeatured();
    fetchFeaturedReview();
    fetchPublicStats();
  }, []);

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
      <main className="min-h-screen bg-background text-on-background">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-8 pt-28 pb-20">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/5 rounded-full blur-[120px]"></div>
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
                <Link href="/pricing">Get Started Free</Link>
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
              { value: publicStats?.display.activeCreators || "0", label: "Active Creators" },
              { value: publicStats?.display.syntheticPosts || "0", label: "Synthetic Posts" },
              { value: publicStats?.display.monthlyReads || "0", label: "Monthly Reads" },
              { value: publicStats?.display.industryMentors || "0", label: "Industry Mentors" },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white/5 backdrop-blur-xl border-white/10 text-center hover:border-primary/30 hover:bg-white/10 transition-all duration-300 group shadow-lg shadow-black/20">
                <CardContent className="p-6">
                  <span className="text-3xl sm:text-4xl font-extrabold font-headline block mb-2 group-hover:text-primary transition-colors">{stat.value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">{stat.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Stories */}
        <section className="py-20 px-4 sm:px-8">
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
                      <img src={featuredPosts[0].cover_image_url} alt={featuredPosts[0].title} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                      {featuredPosts[0].topic && (
                        <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider mb-4">{featuredPosts[0].topic}</Badge>
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
                          <img src={post.cover_image_url} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-linear-to-r from-black/80 to-transparent z-10"></div>
                        <div className="absolute inset-0 p-6 z-20 flex flex-col justify-end">
                          {post.topic && (
                            <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider mb-3 w-fit">{post.topic}</Badge>
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

        {/* Beyond a Platform - Career Engine */}
        <section className="py-20 sm:py-28 px-4 sm:px-8">
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

              {/* Testimonial Card */}
              <Card className="bg-surface-container-low/50 backdrop-blur border-outline-variant/10">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16 rounded-lg">
                      <AvatarImage src={featuredReview?.author?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Community"} />
                      <AvatarFallback className="rounded-lg">CM</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-white">{featuredReview?.author?.name || "Community Member"}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-primary">Verified Community Review</p>
                    </div>
                  </div>
                  <blockquote className="text-on-surface-variant italic leading-relaxed mb-6">
                    &ldquo;{featuredReview?.comment || "Community feedback will appear here as members post reviews."}&rdquo;
                  </blockquote>
                  <Separator className="mb-4" />
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-on-surface-variant">
                    <span>Member Since 2022</span>
                    <Badge variant="outline" className="text-green-400 border-green-400/30">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      Verified Mentor
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 sm:py-28 px-4 sm:px-8">
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

        <Footer />
        <CookieBanner />
      </main>
    </>
  );
}