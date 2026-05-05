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
  const [playerSearch, setPlayerSearch] = useState(searchParams.get("search") ?? "");
  const [sortBy, setSortBy] = useState(
    (searchParams.get("sortBy") as "kills" | "score" | "kd" | "damage") ?? "kills",
  );
  const [sortDir, setSortDir] = useState(
    (searchParams.get("sortDir") as "asc" | "desc") ?? "desc",
  );
  const [minKills, setMinKills] = useState(Number(searchParams.get("minKills") ?? "0"));
  const [topN, setTopN] = useState(Number(searchParams.get("topN") ?? "0"));
  const activeFeed = feeds.find((f) => f.id === activeFeedId) ?? feeds[0];

  const { data, isLoading, error } = useQuery({
    queryKey: ["players", activeFeed?.path],
    queryFn: () => fetchFeed(activeFeed.path),
    enabled: Boolean(activeFeed),
  });

  const rows = useMemo(() => {
    const multiplier = sortDir === "asc" ? 1 : -1;
    const sorted = (data?.players ?? [])
      .filter((p) => p.playerName.toLowerCase().includes(playerSearch.toLowerCase()))
      .filter((p) => p.totalKills >= minKills)
      .slice()
      .sort((a, b) => {
        if (sortBy === "kills") return (a.totalKills - b.totalKills) * multiplier;
        if (sortBy === "score") return (a.totalScore - b.totalScore) * multiplier;
        if (sortBy === "damage") return (a.totalDamageDone - b.totalDamageDone) * multiplier;
        const aKd = a.kdRatio ?? 0;
        const bKd = b.kdRatio ?? 0;
        return (aKd - bKd) * multiplier;
      });
    return topN > 0 ? sorted.slice(0, topN) : sorted;
  }, [data?.players, minKills, playerSearch, sortBy, sortDir, topN]);

  useEffect(() => {
    if (!activeFeed) return;
    const params = new URLSearchParams(searchParams.toString());
    if (
      params.get("event") === activeFeed.id &&
      (params.get("search") ?? "") === playerSearch &&
      (params.get("sortBy") ?? "kills") === sortBy &&
      (params.get("sortDir") ?? "desc") === sortDir &&
      Number(params.get("minKills") ?? "0") === minKills &&
      Number(params.get("topN") ?? "0") === topN
    ) {
      return;
    }
    params.set("event", activeFeed.id);
    if (playerSearch) params.set("search", playerSearch);
    else params.delete("search");
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    if (minKills > 0) params.set("minKills", String(minKills));
    else params.delete("minKills");
    if (topN > 0) params.set("topN", String(topN));
    else params.delete("topN");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeFeed, minKills, pathname, playerSearch, router, searchParams, sortBy, sortDir, topN]);

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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "kills" | "score" | "kd" | "damage")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="kills">Sort: Kills</option>
              <option value="score">Sort: Score</option>
              <option value="kd">Sort: K/D</option>
              <option value="damage">Sort: Damage</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <input
              value={Number.isNaN(minKills) ? 0 : minKills}
              min={0}
              type="number"
              onChange={(e) => setMinKills(Number(e.target.value || "0"))}
              placeholder="Min kills"
              className="w-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value={0}>All</option>
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
            </select>
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
                <th className="px-3 py-2 font-medium text-zinc-700">Damage</th>
                <th className="px-3 py-2 font-medium text-zinc-700">K/D</th>
                <th className="px-3 py-2 font-medium text-zinc-700">Explore</th>
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
                  <td className="px-3 py-2">{player.totalDamageDone}</td>
                  <td className="px-3 py-2">
                    {player.kdRatio == null ? "-" : player.kdRatio.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("feed", activeFeed.id);
                        params.set("team", player.teamId);
                        params.set("map", "all");
                        params.set("player", player.playerName);
                        router.push(`/?${params.toString()}`);
                      }}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                    >
                      Open in LAN
                    </button>
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
