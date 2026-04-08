export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto w-14 h-14 rounded-xl">
          <div className="absolute inset-0 rounded-xl border border-transparent bg-clip-border animate-border-spin"
            style={{
              background: "conic-gradient(from var(--border-angle, 0deg), transparent 40%, #a855f7, #6366f1, #ec4899, #f59e0b, #10b981, transparent 60%) border-box",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: "1.5px",
            }}
          />
          <div className="absolute inset-[6px] rounded-lg bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/60 text-xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              article
            </span>
          </div>
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">Loading</p>
      </div>
    </div>
  );
}
