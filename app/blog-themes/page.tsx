"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { BLOCK_VARIANTS, BlogTheme, FONT_OPTIONS, getThemeFromAny, sanitizeThemeConfig } from "@/lib/blog-themes";

type ThemeCreatorForm = {
  name: string;
  description: string;
  previewIcon: string;
  fontClass: string;
  blockVariant: string;
  isPublic: boolean;
  palette: {
    background: string;
    surface: string;
    text: string;
    mutedText: string;
    heading: string;
    accent: string;
    border: string;
    codeBackground: string;
    codeText: string;
    blockquoteBackground: string;
    tableHeaderBackground: string;
  };
};

export default function BlogThemesPage() {
  const { isAuthenticated } = useAuth();
  const [themes, setThemes] = useState<BlogTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [form, setForm] = useState<ThemeCreatorForm>({
    name: "",
    description: "",
    previewIcon: "🎨",
    fontClass: "font-body",
    blockVariant: "soft",
    isPublic: false,
    palette: {
      background: "#0e0e0e",
      surface: "#1a1a1a",
      text: "#d4d4d8",
      mutedText: "#a1a1aa",
      heading: "#ffffff",
      accent: "#85adff",
      border: "#3f3f46",
      codeBackground: "#161616",
      codeText: "#dbeafe",
      blockquoteBackground: "#0f1d33",
      tableHeaderBackground: "#171717",
    },
  });

  useEffect(() => {
    let active = true;
    const loadThemes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/blog-themes?includeBuiltin=true", { credentials: "include" });
        if (!response.ok) {
          setThemes([]);
          return;
        }
        const data = await response.json();
        const resolved = Array.isArray(data.themes) ? data.themes.map((theme: any) => getThemeFromAny(theme)) : [];
        if (active) setThemes(resolved);
      } catch {
        if (active) setThemes([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadThemes();
    return () => {
      active = false;
    };
  }, []);

  const paletteKeys = useMemo(
    () => Object.keys(form.palette) as Array<keyof ThemeCreatorForm["palette"]>,
    [form.palette]
  );

  const createTheme = async () => {
    if (!form.name.trim()) {
      setFeedback("Theme name is required.");
      return;
    }

    setSaving(true);
    setFeedback("");

    try {
      const safeConfig = sanitizeThemeConfig({
        fontClass: form.fontClass,
        blockVariant: form.blockVariant as any,
        palette: form.palette,
      });

      const response = await fetch("/api/blog-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          previewIcon: form.previewIcon,
          isPublic: form.isPublic,
          themeConfig: safeConfig,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create theme");
      }

      const created = getThemeFromAny(data.theme);
      setThemes((current) => [created, ...current]);
      setFeedback("Theme created successfully.");
      setShowCreator(false);
      setForm((prev) => ({ ...prev, name: "", description: "", previewIcon: "🎨" }));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to create theme");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16 px-4 sm:px-8">
        <section className="max-w-6xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tighter text-on-surface">
                Blog Themes Gallery
              </h1>
              <p className="mt-3 text-on-surface-variant max-w-2xl">
                Pick a style that matches your voice, or build your own theme with custom palettes and typography.
              </p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreator((value) => !value)}
                className="rounded-lg bg-primary text-on-primary-fixed px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                {showCreator ? "Close Creator" : "Create Theme"}
              </button>
            )}
          </div>

          {showCreator && isAuthenticated && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-surface-container p-5 space-y-4">
              <h2 className="text-xl font-bold text-on-surface">Custom Theme Creator</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Theme name"
                  className="rounded-lg bg-surface-container-high border border-white/10 px-3 py-2 text-sm"
                />
                <input
                  value={form.previewIcon}
                  onChange={(e) => setForm((prev) => ({ ...prev, previewIcon: e.target.value }))}
                  placeholder="Preview icon"
                  className="rounded-lg bg-surface-container-high border border-white/10 px-3 py-2 text-sm"
                />
                <select
                  value={form.fontClass}
                  onChange={(e) => setForm((prev) => ({ ...prev, fontClass: e.target.value }))}
                  className="rounded-lg bg-surface-container-high border border-white/10 px-3 py-2 text-sm"
                >
                  {FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Theme description"
                className="w-full rounded-lg bg-surface-container-high border border-white/10 px-3 py-2 text-sm"
                rows={2}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={form.blockVariant}
                  onChange={(e) => setForm((prev) => ({ ...prev, blockVariant: e.target.value }))}
                  className="rounded-lg bg-surface-container-high border border-white/10 px-3 py-2 text-sm"
                >
                  {BLOCK_VARIANTS.map((variant) => (
                    <option key={variant.value} value={variant.value}>{variant.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  Make this theme public for all users
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {paletteKeys.map((key) => (
                  <label key={key} className="text-xs text-on-surface-variant flex items-center gap-2 rounded-lg bg-surface-container-high px-2 py-2">
                    <span className="w-28 truncate">{key}</span>
                    <input
                      type="color"
                      value={form.palette[key]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          palette: {
                            ...prev.palette,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="h-8 w-10"
                    />
                    <span className="text-[11px]">{form.palette[key]}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">Themes are saved per user and can be edited from the admin panel.</p>
                <button
                  onClick={createTheme}
                  disabled={saving}
                  className="rounded-lg bg-primary text-on-primary-fixed px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Theme"}
                </button>
              </div>
              {feedback && <p className="text-xs text-primary">{feedback}</p>}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-on-surface-variant">Loading themes...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {themes.map((theme) => (
                <article
                  key={theme.id}
                  className="rounded-2xl border overflow-hidden shadow-xl transition-all hover:-translate-y-1"
                  style={{ backgroundColor: theme.palette.surface, borderColor: theme.palette.border }}
                >
                  <div className={`h-32 ${theme.fontClass} p-4 flex flex-col justify-between`} style={{ backgroundColor: theme.palette.background, color: theme.palette.text }}>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl">{theme.previewImage}</div>
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.palette.mutedText }}>
                        {theme.source}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: theme.palette.heading }}>{theme.name}</h2>
                      <p className="text-xs line-clamp-2" style={{ color: theme.palette.mutedText }}>{theme.description}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/10 space-y-2">
                    <Link
                      href={`/editor?theme=${encodeURIComponent(theme.id)}`}
                      className="inline-flex items-center justify-center w-full rounded-lg bg-primary text-on-primary-fixed py-2 text-sm font-semibold hover:opacity-90"
                    >
                      Use This Theme
                    </Link>
                    {(theme.creatorName || theme.source === "custom") && (
                      <p className="text-[11px] text-on-surface-variant">
                        {theme.source === "custom" ? `Custom by ${theme.creatorName || "Community Creator"}` : "Built-in library theme"}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
