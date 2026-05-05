import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { BIRMINGHAM_FEEDS, feedCounts, type FeedSection } from "@/config/birmingham-feeds";

const SECTION_LABEL: Record<FeedSection, string> = {
  online_oq: "Online · Open qualifiers",
  online_cq: "Online · Closed qualifiers",
  lan: "LAN · Birmingham",
};

export default function Home() {
  const counts = feedCounts();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <TopNav />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">
            Current build focus is LAN data interrogation with team and player drilldowns.
            Use LAN Explorer to switch stages and inspect per-map statistics.
          </p>
          <Link
            href="/lan"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open LAN Explorer
          </Link>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-500">
            Birmingham feeds (configured)
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(counts) as FeedSection[]).map((key) => (
              <li
                key={key}
                className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {SECTION_LABEL[key]}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {counts[key]}
                </p>
                <p className="text-xs text-zinc-500">endpoints</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            Open qualifiers: EU + NA, R1–R4 with lobby counts 32 / 16 / 8 / 4.
            Total {BIRMINGHAM_FEEDS.length} feed paths.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-500">Stack (installed)</h2>
          <ul className="mt-3 list-inside list-disc text-sm text-zinc-700">
            <li>Next.js (App Router) · React 19 · TypeScript · Tailwind v4</li>
            <li>TanStack Query · TanStack Table · Zod · Recharts</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
