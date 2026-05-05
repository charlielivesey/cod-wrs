"use client";

import { useMemo, useState } from "react";
import { LanFinalDashboard } from "@/components/lan-final-dashboard";
import type { ScoringFeed } from "@/config/birmingham-feeds";

type Region = "EU" | "NA";

export function OpenQualifierExplorer({ feeds }: { feeds: ScoringFeed[] }) {
  const [region, setRegion] = useState<Region>("EU");
  const [round, setRound] = useState<number>(1);

  const filteredFeeds = useMemo(
    () =>
      feeds
        .filter((feed) => feed.region === region && feed.round === round)
        .sort((a, b) => (a.lobby ?? 0) - (b.lobby ?? 0)),
    [feeds, region, round],
  );

  const [lobby, setLobby] = useState<number>(1);
  const maxLobby = filteredFeeds.length > 0 ? (filteredFeeds[filteredFeeds.length - 1].lobby ?? 1) : 1;
  const selectedLobby = Math.min(lobby, maxLobby);
  const selectedFeed = filteredFeeds.find((feed) => feed.lobby === selectedLobby) ?? filteredFeeds[0];

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value as Region);
              setLobby(1);
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="EU">EU</option>
            <option value="NA">NA</option>
          </select>
          <select
            value={round}
            onChange={(e) => {
              setRound(Number(e.target.value));
              setLobby(1);
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value={1}>Round 1</option>
            <option value={2}>Round 2</option>
            <option value={3}>Round 3</option>
            <option value={4}>Round 4</option>
          </select>
          <select
            value={selectedLobby}
            onChange={(e) => setLobby(Number(e.target.value))}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            {filteredFeeds.map((feed) => (
              <option key={feed.id} value={feed.lobby ?? 1}>
                Lobby {feed.lobby}
              </option>
            ))}
          </select>
        </div>
      </section>

      {selectedFeed ? (
        <LanFinalDashboard feeds={[selectedFeed]} showFeedTabs={false} contextLabel="Open qualifier" />
      ) : (
        <p className="text-sm text-zinc-600">No matching open qualifier feed found.</p>
      )}
    </div>
  );
}
