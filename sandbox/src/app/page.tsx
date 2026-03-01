import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--map-background)] text-[var(--map-foreground)]">
      <div className="map-grid pointer-events-none absolute inset-0 opacity-60" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <div className="border border-[var(--map-border)] bg-[rgba(10,8,8,0.86)] p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)]">
          <div className="text-[11px] uppercase tracking-[0.34em] text-[var(--map-muted)]">
            Distral AI / Sandbox
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-vcr)] text-4xl uppercase tracking-[0.14em] text-[var(--map-highlight)] sm:text-6xl">
            System Entry Points
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--map-dim)] sm:text-base">
            Prototype routes for the narrative stealth sandbox. The infected workstation map is isolated here as a standalone feature.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Link
              href="/intro"
              className="border border-[var(--map-border)] bg-black/25 px-5 py-5 text-sm uppercase tracking-[0.18em] transition hover:border-[var(--map-highlight)] hover:bg-white/5"
            >
              Intro Cinematic
            </Link>
            <Link
              href="/map"
              className="border border-[var(--map-current)] bg-[rgba(255,92,43,0.14)] px-5 py-5 text-sm uppercase tracking-[0.18em] transition hover:bg-[rgba(255,92,43,0.2)]"
            >
              Infection Map
            </Link>
            <Link
              href="/game"
              className="border border-[var(--map-border)] bg-black/25 px-5 py-5 text-sm uppercase tracking-[0.18em] transition hover:border-[var(--map-highlight)] hover:bg-white/5"
            >
              Game Placeholder
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
