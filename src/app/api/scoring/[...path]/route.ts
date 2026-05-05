import { SCORING_BASE_URL } from "@/config/constants";
import { NextResponse } from "next/server";

/**
 * Proxies scoring JSON from the upstream host (avoids browser CORS issues).
 * Example: GET /api/scoring/CODWRS_2026_LAN_S1_FinalExt
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const suffix = path?.join("/")?.trim();
  if (!suffix) {
    return NextResponse.json(
      { error: "Missing feed path after /api/scoring/" },
      { status: 400 },
    );
  }

  const upstream = `${SCORING_BASE_URL.replace(/\/$/, "")}/${suffix}`;

  try {
    const upstreamRes = await fetch(upstream, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    const body = await upstreamRes.text();
    const res = new NextResponse(body, {
      status: upstreamRes.status,
      headers: {
        "Content-Type":
          upstreamRes.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upstream fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
