import { Suspense } from "react";
import { TopNav } from "@/components/top-nav";
import { GlobalPlayerLeaderboard } from "@/components/global-player-leaderboard";
import { feedsBySection } from "@/config/birmingham-feeds";

export default function PlayersPage() {
  const lanFeeds = feedsBySection("lan");

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading player page...</p>}>
          <GlobalPlayerLeaderboard feeds={lanFeeds} />
        </Suspense>
      </main>
    </div>
  );
}
