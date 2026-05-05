import { TopNav } from "@/components/top-nav";
import { LanFinalDashboard } from "@/components/lan-final-dashboard";
import { feedsBySection } from "@/config/birmingham-feeds";

export default function Home() {
  const lanFeeds = feedsBySection("lan");

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">LAN Explorer</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Switch between Birmingham LAN feeds and inspect teams, players, and per-map stats.
          </p>
        </section>
        <LanFinalDashboard feeds={lanFeeds} />
      </main>
    </div>
  );
}
