"use client";

import { useMemo, useState } from "react";
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
import { cqExtendedSchema } from "@/lib/schemas/cq-extended";
import { normalizeTeams, type TeamRow } from "@/lib/normalize";

const feedPath = "CODWRS_2026_LAN_S1_FinalExt";

async function fetchLanFinal() {
  const res = await fetch(`/api/scoring/${feedPath}`);
  if (!res.ok) {
    throw new Error(`Feed request failed with ${res.status}`);
  }
  const json = await res.json();
  const parsed = cqExtendedSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Feed format mismatch");
  }
  return normalizeTeams(parsed.data);
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

export function LanFinalDashboard() {
  const [globalFilter, setGlobalFilter] = useState("");
  const { data, error, isLoading } = useQuery({
    queryKey: ["feed", feedPath],
    queryFn: fetchLanFinal,
  });

  const chartData = useMemo(
    () =>
      (data ?? [])
        .slice()
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 10)
        .map((row) => ({ name: row.teamName, score: Number(row.finalScore.toFixed(1)) })),
    [data],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      String(row.original.teamName).toLowerCase().includes(String(filterValue).toLowerCase()),
  });

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading LAN Final data...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Unable to load LAN Final feed: {(error as Error).message}
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-500">LAN S1 Final · Top 10 by score</h2>
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
          <h2 className="text-sm font-medium text-zinc-500">LAN S1 Final · Leaderboard</h2>
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
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-zinc-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {table.getRowModel().rows.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">No teams matched your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
