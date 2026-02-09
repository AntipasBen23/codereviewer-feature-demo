import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0b12] text-white flex items-center justify-center">
      <main className="w-full max-w-xl px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Adaptive Code Review Coach
        </h1>

        <p className="mt-4 text-base text-white/70 leading-relaxed">
          A frontend prototype demonstrating context-aware AI code reviews that
          learn from a repository’s history, style, and past decisions — and
          generate patch-ready fixes, not just comments.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-xl bg-violet-500 px-6 py-3 text-sm font-medium text-white ring-1 ring-violet-500/40 hover:bg-violet-400 transition"
          >
            Open Interactive Demo
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/50">
          Demo is frontend-only. Backend integrations are intentionally mocked.
        </p>
      </main>
    </div>
  );
}
