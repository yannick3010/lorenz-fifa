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
  const cronSecret = process.env.CRON_SECRET;
  const xCronSecret = request.headers.get("x-cron-secret");
  const isCron =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && xCronSecret === cronSecret);

  if (!isCron) {
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
    // Score the 90-minute (regulation) result everywhere: in knockout games the
    // API's fullTime folds in extra-time and shootout goals, which we don't want
    // to display or score against. regularTime only appears once a match goes to
    // extra time, so fall back to fullTime for everything decided in 90.
    const score = m.score ?? {};
    const reg = score.regularTime ?? score.fullTime ?? {};
    const apiHomeScore = reg?.home ?? reg?.homeTeam ?? null;
    const apiAwayScore = reg?.away ?? reg?.awayTeam ?? null;

    const matchData: Record<string, unknown> = {
      external_id: m.id,
      round: m.stage?.replace(/_/g, " ") ?? m.matchday?.toString() ?? "Unknown",
      match_group: m.group?.replace("GROUP_", "") ?? null,
      kickoff_time: m.utcDate,
      status: m.status,
    };

    // Used to score knockouts (who advanced + whether it went past 90). Only
    // write these when the API actually reports them: it sometimes returns a
    // null winner even for a decided shootout, and blanking a known result
    // would re-zero everyone's points on the next sync. (A DB trigger enforces
    // the same rule as a backstop -- see 00006_preserve_match_result.)
    if (score.winner) matchData.winner = score.winner;
    if (score.duration) matchData.duration = score.duration;

    // Only write team names when the API actually knows them. Knockout fixtures
    // arrive with null teams until the bracket resolves; writing "TBD" over an
    // already-known matchup would wipe it on every sync. Omitting the columns
    // preserves existing values on conflict and falls back to the 'TBD' column
    // default for brand-new rows.
    const apiHomeTeam = m.homeTeam?.name ?? null;
    const apiAwayTeam = m.awayTeam?.name ?? null;
    if (apiHomeTeam) matchData.home_team = apiHomeTeam;
    if (apiAwayTeam) matchData.away_team = apiAwayTeam;

    if (apiHomeScore !== null && apiAwayScore !== null) {
      matchData.home_score = apiHomeScore;
      matchData.away_score = apiAwayScore;
    }

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
