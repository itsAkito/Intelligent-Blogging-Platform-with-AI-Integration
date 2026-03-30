"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { ArrowRight, FlaskConical, Radar, Sparkles, TrendingUp } from "lucide-react";

type InnovationItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: "arxiv" | "crossref" | "github";
  category: string;
  publishedAt: string;
};

type InnovationFeed = {
  updatedAt: string;
  featured: InnovationItem | null;
  items: InnovationItem[];
  sources: { arxiv: number; crossref: number; github: number };
};

const SOURCE_LABEL: Record<InnovationItem["source"], string> = {
  arxiv: "arXiv Research",
  crossref: "Crossref Journals",
  github: "Open Source Labs",
};

const SOURCE_COLOR: Record<InnovationItem["source"], string> = {
  arxiv: "text-blue-400",
  crossref: "text-emerald-400",
  github: "text-violet-400",
};

export default function InnovationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<InnovationFeed | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/innovation/feed");
        if (!response.ok) {
          throw new Error("Failed to load innovation feed");
        }
        const data = await response.json();
        setFeed(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feed");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const tickerItems = useMemo(() => {
    return (feed?.items || []).slice(0, 8).map((item) => `${SOURCE_LABEL[item.source]}: ${item.title}`);
  }, [feed?.items]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0e0e0e] pt-24 pb-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <section className="mb-10 overflow-hidden rounded-full border border-white/10 bg-[#131313] px-4 py-2">
            <div className="flex animate-[marquee_45s_linear_infinite] gap-10 whitespace-nowrap text-[11px] uppercase tracking-[0.18em] text-zinc-300">
              {tickerItems.length > 0
                ? [...tickerItems, ...tickerItems].map((txt, idx) => <span key={`${txt}-${idx}`}>{txt}</span>)
                : <span>Loading live innovation ticker...</span>}
            </div>
          </section>

          <section className="mb-12 grid gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-white/10 bg-[#131313] p-8 lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
                <Radar className="h-4 w-4" /> Ground-Level Research
              </div>
              <h1 className="font-headline text-4xl font-black tracking-tight text-white md:text-6xl">
                Innovation Command Center
              </h1>
              <p className="mt-4 max-w-2xl text-zinc-300">
                A real-time blend of research papers, peer-reviewed science, and high-signal open-source innovation.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#1f1f1f] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">arXiv</p>
                  <p className="mt-1 text-2xl font-bold text-blue-400">{feed?.sources.arxiv ?? 0}</p>
                </div>
                <div className="rounded-xl bg-[#1f1f1f] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Crossref</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">{feed?.sources.crossref ?? 0}</p>
                </div>
                <div className="rounded-xl bg-[#1f1f1f] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">GitHub Labs</p>
                  <p className="mt-1 text-2xl font-bold text-violet-400">{feed?.sources.github ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/15 via-violet-500/10 to-emerald-500/10 p-8 lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Featured Breakthrough</p>
              {feed?.featured ? (
                <>
                  <h2 className="mt-3 text-2xl font-bold leading-tight text-white">{feed.featured.title}</h2>
                  <p className="mt-3 line-clamp-5 text-sm text-zinc-200">{feed.featured.summary}</p>
                  <a
                    href={feed.featured.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-black"
                  >
                    Open Source Item <ArrowRight className="h-4 w-4" />
                  </a>
                </>
              ) : (
                <p className="mt-4 text-zinc-300">No featured item available yet.</p>
              )}
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#131313] p-6 text-zinc-300">Loading innovation feed...</div>
            )}

            {error && (
              <div className="col-span-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">{error}</div>
            )}

            {!loading && !error && feed?.items.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#131313] p-6 text-zinc-300">No items found right now.</div>
            )}

            {(feed?.items || []).map((item) => (
              <article key={item.id} className="group rounded-2xl border border-white/10 bg-[#131313] p-6 transition hover:border-white/25 hover:bg-[#171717]">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${SOURCE_COLOR[item.source]}`}>
                    {SOURCE_LABEL[item.source]}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="line-clamp-3 text-xl font-bold tracking-tight text-white group-hover:text-blue-300">
                  {item.title}
                </h3>
                <p className="mt-3 line-clamp-4 text-sm text-zinc-300">{item.summary}</p>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{item.category || "Innovation"}</span>
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-12 rounded-2xl border border-white/10 bg-[#131313] p-8">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">What This Tracks</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-[#1f1f1f] p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-blue-400"><FlaskConical className="h-4 w-4" /> Research</div>
                <p className="text-sm text-zinc-300">Latest preprints from arXiv categories like AI, robotics, and applied physics.</p>
              </div>
              <div className="rounded-xl bg-[#1f1f1f] p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-emerald-400"><TrendingUp className="h-4 w-4" /> Peer Review</div>
                <p className="text-sm text-zinc-300">Recently published articles through Crossref-indexed journals.</p>
              </div>
              <div className="rounded-xl bg-[#1f1f1f] p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-violet-400"><Sparkles className="h-4 w-4" /> Open Innovation</div>
                <p className="text-sm text-zinc-300">Fast-moving public repos representing practical, shipping innovation.</p>
              </div>
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Last update: {feed?.updatedAt ? new Date(feed.updatedAt).toLocaleString() : "-"}
            </p>
            <div className="mt-6">
              <Link href="/community" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5">
                Back to Community <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
