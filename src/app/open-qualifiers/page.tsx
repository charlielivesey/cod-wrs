import { Suspense } from "react";
import { TopNav } from "@/components/top-nav";
import { OpenQualifierExplorer } from "@/components/open-qualifier-explorer";
import { feedsBySection } from "@/config/birmingham-feeds";

export default function OpenQualifiersPage() {
  const feeds = feedsBySection("online_oq");

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Open Qualifiers</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Select region, round, and lobby to inspect each open qualifier feed.
          </p>
        </section>
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading open qualifiers...</p>}>
          <OpenQualifierExplorer feeds={feeds} />
        </Suspense>
      </main>
    </div>
  );
}
