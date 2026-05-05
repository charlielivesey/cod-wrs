/**
 * Birmingham (Season 1) scoring feed catalogue.
 * Paths are appended to {@link SCORING_BASE_URL} (see `src/config/constants.ts`).
 */

export type FeedSection = "online_oq" | "online_cq" | "lan";

/** Payload shape for validation (see `schema/`). All current Birmingham *Ext URLs observed as extended standings. */
export type FeedKind = "cq_extended" | "oq_standings";

export type Region = "EU" | "NA";

export type ScoringFeed = {
  /** Stable id for keys and caching */
  id: string;
  section: FeedSection;
  /** Human label for navigation */
  label: string;
  /** URL path after origin, e.g. CODWRS_2026_EU_S1_Open_R1_1Ext */
  path: string;
  kind: FeedKind;
  region?: Region;
  /** Open qualifier round (R1–R4) */
  round?: number;
  lobby?: number;
};

const OPEN_ROUND_LOBBIES: readonly { round: number; lobbies: number }[] = [
  { round: 1, lobbies: 32 },
  { round: 2, lobbies: 16 },
  { round: 3, lobbies: 8 },
  { round: 4, lobbies: 4 },
];

function buildOpenQualifierFeeds(): ScoringFeed[] {
  const out: ScoringFeed[] = [];
  for (const region of ["EU", "NA"] as const) {
    for (const { round, lobbies } of OPEN_ROUND_LOBBIES) {
      for (let lobby = 1; lobby <= lobbies; lobby++) {
        const path = `CODWRS_2026_${region}_S1_Open_R${round}_${lobby}Ext`;
        out.push({
          id: `oq-${region}-r${round}-l${lobby}`,
          section: "online_oq",
          label: `${region} Open R${round} · Lobby ${lobby}`,
          path,
          kind: "cq_extended",
          region,
          round,
          lobby,
        });
      }
    }
  }
  return out;
}

const CLOSED_QUALIFIER_FEEDS: ScoringFeed[] = [
  {
    id: "cq-eu-lower-r1",
    section: "online_cq",
    label: "EU Lower R1",
    path: "CODWRS_2026_EU_S1_Lower_R1Ext",
    kind: "cq_extended",
    region: "EU",
  },
  {
    id: "cq-eu-lower-r2",
    section: "online_cq",
    label: "EU Lower R2",
    path: "CODWRS_2026_EU_S1_Lower_R2Ext",
    kind: "cq_extended",
    region: "EU",
  },
  {
    id: "cq-eu-upper",
    section: "online_cq",
    label: "EU Upper",
    path: "CODWRS_2026_EU_S1_UpperExt",
    kind: "cq_extended",
    region: "EU",
  },
  {
    id: "cq-eu-final",
    section: "online_cq",
    label: "EU Final",
    path: "CODWRS_2026_EU_S1_FinalExt",
    kind: "cq_extended",
    region: "EU",
  },
  {
    id: "cq-na-lower-r1",
    section: "online_cq",
    label: "NA Lower R1",
    path: "CODWRS_2026_NA_S1_Lower_R1Ext",
    kind: "cq_extended",
    region: "NA",
  },
  {
    id: "cq-na-lower-r2",
    section: "online_cq",
    label: "NA Lower R2",
    path: "CODWRS_2026_NA_S1_Lower_R2Ext",
    kind: "cq_extended",
    region: "NA",
  },
  {
    id: "cq-na-upper",
    section: "online_cq",
    label: "NA Upper",
    path: "CODWRS_2026_NA_S1_UpperExt",
    kind: "cq_extended",
    region: "NA",
  },
  {
    id: "cq-na-final",
    section: "online_cq",
    label: "NA Final",
    path: "CODWRS_2026_NA_S1_FinalExt",
    kind: "cq_extended",
    region: "NA",
  },
];

const LAN_FEEDS: ScoringFeed[] = [
  {
    id: "lan-s1-open-r1a",
    section: "lan",
    label: "LAN Open R1 A",
    path: "CODWRS_2026_LAN_S1_Open_R1_AExt",
    kind: "cq_extended",
  },
  {
    id: "lan-s1-open-r1b",
    section: "lan",
    label: "LAN Open R1 B",
    path: "CODWRS_2026_LAN_S1_Open_R1_BExt",
    kind: "cq_extended",
  },
  {
    id: "lan-s1-open-r2",
    section: "lan",
    label: "LAN Open R2",
    path: "CODWRS_2026_LAN_S1_Open_R2Ext",
    kind: "cq_extended",
  },
  {
    id: "lan-s1-final",
    section: "lan",
    label: "LAN Final",
    path: "CODWRS_2026_LAN_S1_FinalExt",
    kind: "cq_extended",
  },
];

/** All configured Birmingham feeds (online OQ lobbies + CQ + LAN). */
export const BIRMINGHAM_FEEDS: ScoringFeed[] = [
  ...buildOpenQualifierFeeds(),
  ...CLOSED_QUALIFIER_FEEDS,
  ...LAN_FEEDS,
];

export function feedsBySection(section: FeedSection): ScoringFeed[] {
  return BIRMINGHAM_FEEDS.filter((f) => f.section === section);
}

export function feedCounts(): Record<FeedSection, number> {
  return {
    online_oq: feedsBySection("online_oq").length,
    online_cq: feedsBySection("online_cq").length,
    lan: feedsBySection("lan").length,
  };
}
