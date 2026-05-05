import Link from "next/link";
import { LanFinalDashboard } from "@/components/lan-final-dashboard";
import {
  BIRMINGHAM_FEEDS,
  feedCounts,
  type FeedSection,
} from "@/config/birmingham-feeds";
import { SCORING_BASE_URL } from "@/config/constants";

const SECTION_LABEL: Record<FeedSection, string> = {
  online_oq: "Online · Open qualifiers",
  online_cq: "Online · Closed qualifiers",
  lan: "LAN · Birmingham",
};

export default function Home() {
  const counts = feedCounts();
  const sample = BIRMINGHAM_FEEDS.find((f) => f.id === "lan-s1-final");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-5">
        <h1 className="text-xl font-semibold tracking-tight">
          COD WRS scoring
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Visualisation app scaffold. Framework and phased delivery are in{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
            docs/FRAMEWORK_AND_DELIVERY.md
          </code>{" "}
          at the repository root.
        </p>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-500">Upstream</h2>
          <p className="mt-2 font-mono text-sm">{SCORING_BASE_URL}</p>
          <p className="mt-3 text-sm text-zinc-600">
            Proxied reads:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
              /api/scoring/&lt;feedPath&gt;
            </code>
          </p>
          {sample && (
            <p className="mt-2 text-sm text-zinc-600">
              Example:{" "}
              <Link
                className="font-mono text-sm text-blue-700 underline-offset-2 hover:underline"
                href={`/api/scoring/${sample.path}`}
              >
                /api/scoring/{sample.path}
              </Link>
            </p>
          )}
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

        <LanFinalDashboard />
      </main>
    </div>
  );
}
