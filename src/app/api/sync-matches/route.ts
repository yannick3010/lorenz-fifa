import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const WC_COMPETITION_ID = 2000;

export async function POST(request: Request) {
  return handleSync(request);
}

export async function GET(request: Request) {
  return handleSync(request);
}

async function handleSync(request: Request) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
  } else {
    const cronSecret = request.headers.get("x-cron-secret");
    const isVercelCron = request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
    if (cronSecret !== process.env.CRON_SECRET && !isVercelCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const res = await fetch(
    `${FOOTBALL_DATA_BASE}/competitions/${WC_COMPETITION_ID}/matches`,
    { headers: { "X-Auth-Token": apiKey } }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Football-Data API error: ${res.status}`, details: text },
      { status: 502 }
    );
  }

  const data = await res.json();
  const matches = data.matches ?? [];

  let upserted = 0;
  let scored = 0;

  for (const m of matches) {
    const matchData = {
      external_id: m.id,
      round: m.stage?.replace(/_/g, " ") ?? m.matchday?.toString() ?? "Unknown",
      match_group: m.group?.replace("GROUP_", "") ?? null,
      home_team: m.homeTeam?.name ?? "TBD",
      away_team: m.awayTeam?.name ?? "TBD",
      home_score: m.score?.fullTime?.home ?? null,
      away_score: m.score?.fullTime?.away ?? null,
      kickoff_time: m.utcDate,
      status: m.status,
    };

    const { error } = await supabase.from("matches").upsert(matchData, {
      onConflict: "external_id",
    });

    if (!error) upserted++;

    if (m.status === "FINISHED") {
      const { data: dbMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("external_id", m.id)
        .single();

      if (dbMatch) {
        await supabase.rpc("score_match", { p_match_id: dbMatch.id });
        scored++;
      }
    }
  }

  return NextResponse.json({
    message: `Synced ${upserted} matches, scored ${scored} finished matches`,
    total: matches.length,
  });
}
