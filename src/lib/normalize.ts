import type { CqExtendedPayload } from "@/lib/schemas/cq-extended";

export type TeamRow = {
  rank: number;
  teamName: string;
  totalKills: number;
  finalScore: number;
  avgPlacement: number | null;
  maxPlayerKills: number;
};

export function normalizeTeams(payload: CqExtendedPayload): TeamRow[] {
  return payload.standings.map((team) => {
    const allKills = team.players.flatMap((p) => p.kills);
    const avgPlacement =
      team.placements.length > 0
        ? team.placements.reduce((sum, p) => sum + p, 0) / team.placements.length
        : null;

    return {
      rank: team.rank,
      teamName: team.team_name,
      totalKills: team.total_kills,
      finalScore: team.final_score,
      avgPlacement,
      maxPlayerKills: allKills.length > 0 ? Math.max(...allKills) : 0,
    };
  });
}
