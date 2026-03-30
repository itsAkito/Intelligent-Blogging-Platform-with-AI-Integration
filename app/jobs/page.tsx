"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  category: string;
  contractTime: string;
  contractType: string;
  applyUrl: string;
  postedAt: string;
  area: string[];
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("software developer");
  const [searchInput, setSearchInput] = useState("software developer");
  const [country, setCountry] = useState("in");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query,
        country,
        page: String(page),
        limit: "10",
      });
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setMessage(data.message || "");
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [query, country, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    setPage(1);
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return "Not disclosed";
    const fmt = (n: number) => {
      if (country === "in") {
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        return `₹${n.toLocaleString("en-IN")}`;
      }
      return `$${(n / 1000).toFixed(0)}K`;
    };
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 pb-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Link href="/" className="text-on-surface-variant hover:text-primary text-sm transition-colors">Home</Link>
              <span className="text-on-surface-variant/50">/</span>
              <span className="text-sm text-primary font-medium">Jobs</span>
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl font-extrabold tracking-tighter text-on-surface leading-[0.9]">
              Career <span className="text-gradient italic">Opportunities</span>
            </h1>
            <p className="text-sm text-on-surface-variant mt-3 max-w-lg">
              Discover jobs from India and around the world. Powered by Adzuna.
            </p>
          </header>

          {/* Search & Filters */}
          <Card className="bg-surface-container border-outline-variant/10 rounded-2xl mb-8">
            <CardContent className="p-5">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 bg-surface-container-low rounded-xl px-4 border border-outline-variant/15 focus-within:border-primary/40 transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                  <Input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Job title, keyword, or company..."
                    className="flex-1 bg-transparent border-0 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <select
                  suppressHydrationWarning
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); setPage(1); }}
                  className="px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/15 text-sm text-on-surface outline-none focus:border-primary/40 transition-colors cursor-pointer"
                >
                  <option value="in">🇮🇳 India</option>
                  <option value="gb">🇬🇧 United Kingdom</option>
                  <option value="us">🇺🇸 United States</option>
                  <option value="de">🇩🇪 Germany</option>
                  <option value="au">🇦🇺 Australia</option>
                  <option value="ca">🇨🇦 Canada</option>
                </select>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-xl text-sm px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Search Jobs
                </Button>
              </form>

              {/* Quick category filters */}
              <div className="flex flex-wrap gap-2 mt-4">
                {["Software Developer", "Data Scientist", "Product Manager", "DevOps", "UI/UX Designer", "AI/ML Engineer", "Cloud Architect"].map((cat) => (
                  <Badge
                    key={cat}
                    variant={query === cat ? "default" : "outline"}
                    className={`cursor-pointer text-xs py-1 px-3 transition-all ${
                      query === cat
                        ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20"
                        : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                    onClick={() => { setSearchInput(cat); setQuery(cat); setPage(1); }}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {message && (
            <Card className="mb-6 bg-yellow-500/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-3 flex items-center gap-2 text-yellow-400 text-sm">
                <span className="material-symbols-outlined text-sm">info</span>
                {message}
              </CardContent>
            </Card>
          )}

          {/* Results count */}
          <div className="flex justify-between items-center mb-5">
            <span className="text-sm text-on-surface-variant">
              {loading ? "Searching..." : `${total.toLocaleString()} jobs found`}
            </span>
          </div>

          {/* Job Listings */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-surface-container border-outline-variant/10 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-xl bg-surface-container-high" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-2/3 bg-surface-container-high" />
                        <Skeleton className="h-4 w-1/3 bg-surface-container-high" />
                        <Skeleton className="h-3 w-full bg-surface-container-high mt-4" />
                        <Skeleton className="h-3 w-4/5 bg-surface-container-high" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="bg-surface-container border-outline-variant/10 rounded-2xl hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">work</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold font-headline text-on-surface group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-on-surface-variant">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">apartment</span>
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">schedule</span>
                                {timeAgo(job.postedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-on-surface-variant mt-4 leading-relaxed line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-4">
                          {job.category && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                              {job.category}
                            </Badge>
                          )}
                          {job.contractTime && (
                            <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-[10px] font-bold">
                              {job.contractTime.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-extrabold font-headline text-on-surface">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                          <span className="block text-[10px] text-on-surface-variant uppercase tracking-wider">
                            {country === "in" ? "per annum" : "per year"}
                          </span>
                        </div>
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold rounded-lg text-sm px-6 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all gap-1.5">
                            Apply Now
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && jobs.length > 0 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="border-outline-variant/20 bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm"
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-on-surface-variant">
                Page {page} of {Math.ceil(total / 10) || 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / 10)}
                className="border-outline-variant/20 bg-surface-container-low text-on-surface rounded-xl font-semibold text-sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
