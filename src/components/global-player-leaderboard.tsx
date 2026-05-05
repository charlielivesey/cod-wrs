"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ScoringFeed } from "@/config/birmingham-feeds";
import { normalizeFeed } from "@/lib/normalize";
import { cqExtendedSchema } from "@/lib/schemas/cq-extended";

async function fetchFeed(path: string) {
  const res = await fetch(`/api/scoring/${path}`);
  if (!res.ok) {
    throw new Error(`Feed request failed with ${res.status}`);
  }
  const json = await res.json();
  const parsed = cqExtendedSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Feed format mismatch");
  }
  return normalizeFeed(parsed.data);
}

export function GlobalPlayerLeaderboard({ feeds }: { feeds: ScoringFeed[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFeedId =
    searchParams.get("event") && feeds.some((f) => f.id === searchParams.get("event"))
      ? (searchParams.get("event") as string)
      : feeds[0]?.id ?? "";
  const [activeFeedId, setActiveFeedId] = useState(initialFeedId);
  const [playerSearch, setPlayerSearch] = useState("");
  const activeFeed = feeds.find((f) => f.id === activeFeedId) ?? feeds[0];

  const { data, isLoading, error } = useQuery({
    queryKey: ["players", activeFeed?.path],
    queryFn: () => fetchFeed(activeFeed.path),
    enabled: Boolean(activeFeed),
  });

  const rows = useMemo(
    () =>
      (data?.players ?? [])
        .filter((p) => p.playerName.toLowerCase().includes(playerSearch.toLowerCase()))
        .slice()
        .sort((a, b) => b.totalKills - a.totalKills),
    [data?.players, playerSearch],
  );

  useEffect(() => {
    if (!activeFeed) return;
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("event") === activeFeed.id) return;
    params.set("event", activeFeed.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeFeed, pathname, router, searchParams]);

  if (isLoading) return <p className="text-sm text-zinc-600">Loading player leaderboard...</p>;
  if (error) return <p className="text-sm text-red-600">Unable to load players: {(error as Error).message}</p>;

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Global Player Leaderboard</h2>
            <p className="mt-1 text-sm text-zinc-600">Select an event to view full player rankings.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={activeFeedId}
              onChange={(e) => setActiveFeedId(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              {feeds.map((feed) => (
                <option key={feed.id} value={feed.id}>
                  {feed.label}
                </option>
              ))}
            </select>
            <input
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Search player..."
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-3 py-2 font-medium text-zinc-700">Rank</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Player</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Team</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Kills</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Score</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Assists</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Deaths</th>
                <th className="px-3 py-2 font-medium text-zinc-700">K/D</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player, i) => (
                <tr key={`${player.teamName}-${player.playerName}`} className="border-b border-zinc-100">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-zinc-800">{player.playerName}</td>
                  <td className="px-3 py-2">{player.teamName}</td>
                  <td className="px-3 py-2">{player.totalKills}</td>
                  <td className="px-3 py-2">{player.totalScore.toFixed(1)}</td>
                  <td className="px-3 py-2">{player.totalAssists}</td>
                  <td className="px-3 py-2">{player.totalDeaths}</td>
                  <td className="px-3 py-2">
                    {player.kdRatio == null ? "-" : player.kdRatio.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">No players matched your search.</p>
          )}
        </div>
      </section>
    </div>
  );
}
