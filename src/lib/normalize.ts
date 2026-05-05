import type { CqExtendedPayload } from "@/lib/schemas/cq-extended";

export type TeamRow = {
  id: string;
  rank: number;
  teamName: string;
  totalKills: number;
  finalScore: number;
  avgPlacement: number | null;
  maxPlayerKills: number;
};

export type PlayerRow = {
  teamId: string;
  teamName: string;
  playerName: string;
  stream: string;
  totalKills: number;
  totalScore: number;
  totalAssists: number;
  totalDeaths: number;
  totalDamageDone: number;
  totalDamageTaken: number;
  kdRatio: number | null;
  byMap: {
    mapIndex: number;
    kills: number;
    score: number;
    assists: number;
    deaths: number;
    damageDone: number;
    damageTaken: number;
    deadliestWeapon: string | null;
    weaponKills: number;
  }[];
};

export type NormalizedFeed = {
  teams: TeamRow[];
  players: PlayerRow[];
  mapCount: number;
};

export function normalizeFeed(payload: CqExtendedPayload): NormalizedFeed {
  const teams = payload.standings.map((team) => {
    const allKills = team.players.flatMap((p) => p.kills);
    const avgPlacement =
      team.placements.length > 0
        ? team.placements.reduce((sum, p) => sum + p, 0) / team.placements.length
        : null;

    return {
      id: team.team_name,
      rank: team.rank,
      teamName: team.team_name,
      totalKills: team.total_kills,
      finalScore: team.final_score,
      avgPlacement,
      maxPlayerKills: allKills.length > 0 ? Math.max(...allKills) : 0,
    };
  });

  const players: PlayerRow[] = payload.standings.flatMap((team) =>
    team.players.map((player) => {
      const mapCount = Math.max(
        player.kills.length,
        player.scores.length,
        player.assists.length,
        player.deaths.length,
      );
      const byMap = Array.from({ length: mapCount }, (_, idx) => ({
        mapIndex: idx + 1,
        kills: player.kills[idx] ?? 0,
        score: player.scores[idx] ?? 0,
        assists: player.assists[idx] ?? 0,
        deaths: player.deaths[idx] ?? 0,
        damageDone: player.damage_done[idx] ?? 0,
        damageTaken: player.damage_taken[idx] ?? 0,
        deadliestWeapon: player.deadliest_weapon[idx] ?? null,
        weaponKills: player.dw_kills[idx] ?? 0,
      }));

      const totalKills = byMap.reduce((sum, row) => sum + row.kills, 0);
      const totalDeaths = byMap.reduce((sum, row) => sum + row.deaths, 0);
      const totalScore = byMap.reduce((sum, row) => sum + row.score, 0);
      const totalAssists = byMap.reduce((sum, row) => sum + row.assists, 0);
      const totalDamageDone = byMap.reduce((sum, row) => sum + row.damageDone, 0);
      const totalDamageTaken = byMap.reduce((sum, row) => sum + row.damageTaken, 0);

      return {
        teamId: team.team_name,
        teamName: team.team_name,
        playerName: player.name,
        stream: player.stream,
        totalKills,
        totalScore,
        totalAssists,
        totalDeaths,
        totalDamageDone,
        totalDamageTaken,
        kdRatio: totalDeaths > 0 ? totalKills / totalDeaths : null,
        byMap,
      };
    }),
  );

  const mapCount = Math.max(0, ...players.map((p) => p.byMap.length));
  return { teams, players, mapCount };
}
