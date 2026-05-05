"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScoringFeed } from "@/config/birmingham-feeds";
import { cqExtendedSchema } from "@/lib/schemas/cq-extended";
import { normalizeFeed, type TeamRow } from "@/lib/normalize";

async function fetchLanFeed(feedPath: string) {
  const res = await fetch(`/api/scoring/${feedPath}`);
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

const columns: ColumnDef<TeamRow>[] = [
  { accessorKey: "rank", header: "Rank" },
  { accessorKey: "teamName", header: "Team" },
  { accessorKey: "totalKills", header: "Kills" },
  {
    accessorKey: "finalScore",
    header: "Score",
    cell: ({ getValue }) => Number(getValue()).toFixed(1),
  },
  {
    accessorKey: "avgPlacement",
    header: "Avg Place",
    cell: ({ getValue }) => {
      const value = getValue<number | null>();
      return value == null ? "-" : value.toFixed(2);
    },
  },
  { accessorKey: "maxPlayerKills", header: "Top Player Kills" },
];

export function LanFinalDashboard({ feeds }: { feeds: ScoringFeed[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialFeedId =
    searchParams.get("feed") && feeds.some((f) => f.id === searchParams.get("feed"))
      ? (searchParams.get("feed") as string)
      : feeds[0]?.id ?? "";
  const initialTeamId = searchParams.get("team");
  const initialMap =
    searchParams.get("map") === "all"
      ? "all"
      : Number.isFinite(Number(searchParams.get("map")))
        ? Number(searchParams.get("map"))
        : "all";
  const initialPlayerSearch = searchParams.get("player") ?? "";

  const [globalFilter, setGlobalFilter] = useState("");
  const [activeFeedId, setActiveFeedId] = useState(initialFeedId);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(initialTeamId);
  const [selectedMap, setSelectedMap] = useState<number | "all">(initialMap);
  const [playerSearch, setPlayerSearch] = useState(initialPlayerSearch);
  const activeFeed = feeds.find((feed) => feed.id === activeFeedId) ?? feeds[0];

  const { data, error, isLoading } = useQuery({
    queryKey: ["feed", activeFeed?.path],
    queryFn: () => fetchLanFeed(activeFeed.path),
    enabled: Boolean(activeFeed),
  });

  const teamRows = useMemo(() => data?.teams ?? [], [data?.teams]);
  const playerRows = useMemo(() => data?.players ?? [], [data?.players]);
  const selectedTeam = teamRows.find((team) => team.id === selectedTeamId) ?? teamRows[0] ?? null;
  const scopedPlayers = playerRows.filter((player) => player.teamId === selectedTeam?.id);
  useEffect(() => {
    if (!selectedTeam && teamRows.length > 0) {
      setSelectedTeamId(teamRows[0].id);
    }
  }, [selectedTeam, teamRows]);

  useEffect(() => {
    if (!activeFeed) {
      return;
    }
    const currentFeed = searchParams.get("feed");
    const currentTeam = searchParams.get("team");
    const currentMap = searchParams.get("map");
    const currentPlayer = searchParams.get("player");
    const nextMap = String(selectedMap);
    if (
      currentFeed === activeFeed.id &&
      (currentTeam ?? "") === (selectedTeamId ?? "") &&
      (currentMap ?? "all") === nextMap &&
      (currentPlayer ?? "") === playerSearch
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("feed", activeFeed.id);
    if (selectedTeamId) params.set("team", selectedTeamId);
    else params.delete("team");
    params.set("map", nextMap);
    if (playerSearch) params.set("player", playerSearch);
    else params.delete("player");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeFeed, pathname, playerSearch, router, searchParams, selectedMap, selectedTeamId]);

  const chartData = useMemo(
    () =>
      teamRows
        .slice()
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 10)
        .map((row) => ({ name: row.teamName, score: Number(row.finalScore.toFixed(1)) })),
    [teamRows],
  );

  const table = useReactTable({
    data: teamRows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      String(row.original.teamName).toLowerCase().includes(String(filterValue).toLowerCase()),
  });

  const filteredPlayers = scopedPlayers
    .filter((player) => player.playerName.toLowerCase().includes(playerSearch.toLowerCase()))
    .map((player) => {
      if (selectedMap === "all") {
        return {
          playerName: player.playerName,
          stream: player.stream,
          kills: player.totalKills,
          score: player.totalScore,
          assists: player.totalAssists,
          deaths: player.totalDeaths,
          damageDone: player.totalDamageDone,
          damageTaken: player.totalDamageTaken,
          deadliestWeapon: "-",
          weaponKills: "-",
          kd: player.kdRatio == null ? "-" : player.kdRatio.toFixed(2),
        };
      }
      const map = player.byMap[selectedMap - 1];
      return {
        playerName: player.playerName,
        stream: player.stream,
        kills: map?.kills ?? 0,
        score: map?.score ?? 0,
        assists: map?.assists ?? 0,
        deaths: map?.deaths ?? 0,
        damageDone: map?.damageDone ?? 0,
        damageTaken: map?.damageTaken ?? 0,
        deadliestWeapon: map?.deadliestWeapon ?? "-",
        weaponKills: map?.weaponKills ?? 0,
        kd:
          map && map.deaths > 0
            ? (map.kills / map.deaths).toFixed(2)
            : map
              ? String(map.kills)
              : "-",
      };
    });

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading LAN feed...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Unable to load LAN feed: {(error as Error).message}
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {feeds.map((feed) => (
            <button
              key={feed.id}
              type="button"
              onClick={() => {
                setActiveFeedId(feed.id);
                setSelectedTeamId(null);
                setSelectedMap("all");
                setPlayerSearch("");
                setGlobalFilter("");
              }}
              className={`rounded-md px-3 py-1.5 text-sm ${
                feed.id === activeFeed?.id
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {feed.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-500">
          {activeFeed?.label ?? "LAN"} · Top 10 by score
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="score" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-zinc-500">
            {activeFeed?.label ?? "LAN"} · Leaderboard
          </h2>
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search team..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm sm:w-64"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-zinc-200 text-left">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2 font-medium text-zinc-700">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-medium text-zinc-700">Details</th>
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-zinc-100 ${
                    row.original.id === selectedTeam?.id ? "bg-blue-50/50" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-zinc-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeamId(row.original.id);
                        setSelectedMap("all");
                      }}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                    >
                      View players
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {table.getRowModel().rows.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">No teams matched your search.</p>
          )}
        </div>
      </div>

      {selectedTeam && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-zinc-500">Team drilldown</h2>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{selectedTeam.teamName}</p>
              <p className="text-xs text-zinc-500">
                Player-level interrogation {selectedMap === "all" ? "for all maps" : `for map ${selectedMap}`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Search player..."
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm sm:w-56"
              />
              <select
                value={selectedMap}
                onChange={(e) =>
                  setSelectedMap(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All maps</option>
                {Array.from({ length: data?.mapCount ?? 0 }, (_, i) => i + 1).map((map) => (
                  <option key={map} value={map}>
                    Map {map}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left">
                  <th className="px-3 py-2 font-medium text-zinc-700">Player</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Kills</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Score</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Assists</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Deaths</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">K/D</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Damage Done</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Damage Taken</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Deadliest Weapon</th>
                  <th className="px-3 py-2 font-medium text-zinc-700">Weapon Kills</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.playerName} className="border-b border-zinc-100">
                    <td className="px-3 py-2">
                      <p className="font-medium text-zinc-800">{player.playerName}</p>
                      <a
                        className="text-xs text-blue-700 underline-offset-2 hover:underline"
                        href={player.stream.startsWith("http") ? player.stream : `https://${player.stream}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        stream
                      </a>
                    </td>
                    <td className="px-3 py-2 text-zinc-700">{player.kills}</td>
                    <td className="px-3 py-2 text-zinc-700">{Number(player.score).toFixed(1)}</td>
                    <td className="px-3 py-2 text-zinc-700">{player.assists}</td>
                    <td className="px-3 py-2 text-zinc-700">{player.deaths}</td>
                    <td className="px-3 py-2 text-zinc-700">{player.kd}</td>
                    <td className="px-3 py-2 text-zinc-700">{player.damageDone}</td>
                    <td className="px-3 py-2 text-zinc-700">{player.damageTaken}</td>
                    <td className="px-3 py-2 text-zinc-700">{player.deadliestWeapon}</td>
                    <td className="px-3 py-2 text-zinc-700">{player.weaponKills}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPlayers.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">No players matched this filter.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
