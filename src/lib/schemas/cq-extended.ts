import { z } from "zod";

const numberArray = z.array(z.number().nonnegative());
const intArray = z.array(z.number().int().nonnegative());

const playerSchema = z.object({
  name: z.string(),
  stream: z.string(),
  kills: intArray,
  scores: numberArray,
  assists: intArray.optional().default([]),
  deaths: intArray.optional().default([]),
  damage_done: intArray.optional().default([]),
  damage_taken: intArray.optional().default([]),
  deadliest_weapon: z.array(z.string().nullable()).optional().default([]),
  dw_kills: intArray.optional().default([]),
});

const standingSchema = z.object({
  team_name: z.string(),
  total_kills: z.number().int().nonnegative(),
  final_score: z.number().nonnegative(),
  rank: z.number().int().positive(),
  max_kills: z.number().int().nonnegative().optional(),
  placements: z.array(z.number().int()).optional().default([]),
  scores: numberArray.optional().default([]),
  players: z.array(playerSchema).min(3),
});

export const cqExtendedSchema = z.object({
  pagination: z
    .object({
      page: z.number().int(),
      total_pages: z.number().int(),
      prev: z.nullable(z.unknown()),
      next: z.nullable(z.unknown()),
    })
    .optional(),
  standings: z.array(standingSchema),
});

export type CqExtendedPayload = z.infer<typeof cqExtendedSchema>;
