export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Match, LeaderboardEntry, Prediction } from "@/lib/supabase/types";
import { LiveMatches } from "@/components/live-matches";
import { LiveLeaderboard } from "@/components/live-leaderboard";
import { PredictionReminder } from "@/components/prediction-reminder";
import { TeamName } from "@/components/team-name";
import { Countdown } from "@/components/countdown";
import { pointsBadgeColor, pointsLabel } from "@/lib/scoring";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["TIMED", "SCHEDULED"])
    .order("kickoff_time", { ascending: true })
    .limit(6);

  const { data: liveMatches } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["IN_PLAY", "PAUSED", "HALFTIME"])
    .order("kickoff_time", { ascending: true });

  const { data: recentResults } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "FINISHED")
    .order("kickoff_time", { ascending: false })
    .limit(4);

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user!.id);

  const predictionMap = new Map<number, Prediction>();
  predictions?.forEach((p: Prediction) => predictionMap.set(p.match_id, p));

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fifa-muted)]">
            FIFA World Cup
          </p>
          <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            Predictions
          </h1>
        </div>
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--fifa-red)]" />
          <span className="h-2 w-2 rounded-full bg-white" />
          <span className="h-2 w-2 rounded-full bg-[var(--fifa-blue)]" />
        </div>
      </div>

      <PredictionReminder />

      <LiveMatches initialMatches={(liveMatches as Match[]) ?? []} />

      {/* Upcoming */}
      <section>
        <SectionHeader title="Upcoming" href="/matches" />
        {(upcomingMatches?.length ?? 0) > 0 ? (
          <div className="grid gap-2">
            {upcomingMatches!.map((match: Match) => {
              const pred = predictionMap.get(match.id);
              const hasPrediction = !!pred;
              const hoursUntil = (new Date(match.kickoff_time).getTime() - Date.now()) / 3_600_000;
              const isUrgent = !hasPrediction && hoursUntil < 24 && hoursUntil > 0;

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 transition active:scale-[0.98] ${
                    isUrgent
                      ? "border-amber-500/60 bg-amber-500/5"
                      : hasPrediction
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-[var(--fifa-border)] bg-[var(--fifa-panel)]"
                  }`}
                >
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <span className="flex justify-end"><TeamName name={match.home_team} /></span>
                        <span className="text-xs text-[var(--fifa-muted)]">vs</span>
                        <span className="flex justify-start"><TeamName name={match.away_team} /></span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Countdown kickoff={match.kickoff_time} />
                    <p className="text-[10px] text-[var(--fifa-muted)]">
                      {match.match_group ? `Group ${match.match_group}` : match.round}
                    </p>
                    {isUrgent ? (
                      <p className="text-[10px] font-bold text-amber-400">Not picked!</p>
                    ) : hasPrediction ? (
                      <p className="text-[10px] font-semibold text-emerald-400">Picked</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--fifa-muted)]">No upcoming matches.</p>
        )}
      </section>

      {/* Recent Results */}
      {(recentResults?.length ?? 0) > 0 && (
        <section>
          <SectionHeader title="Results" href="/matches" />
          <div className="grid gap-2">
            {recentResults!.map((match: Match) => {
              const pred = predictionMap.get(match.id);
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-3.5 transition active:scale-[0.98]"
                >
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <span className="flex justify-end"><TeamName name={match.home_team} /></span>
                    <span className="font-mono text-lg font-black tabular-nums text-white">
                      {match.home_score}
                      <span className="mx-1 text-[var(--fifa-muted)]">:</span>
                      {match.away_score}
                    </span>
                    <span className="flex justify-start"><TeamName name={match.away_team} /></span>
                  </div>
                  {pred && pred.points_earned !== null && (
                    <div className="mt-2 flex items-center justify-center gap-2 border-t border-[var(--fifa-border)] pt-2">
                      <span className="text-[10px] text-[var(--fifa-muted)]">
                        You: {pred.home_score}:{pred.away_score}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${pointsBadgeColor(
                          pred.points_earned
                        )}`}
                      >
                        +{pred.points_earned} {pointsLabel(pred.points_earned)}
                      </span>
                    </div>
                  )}
                  {pred && pred.points_earned === null && (
                    <div className="mt-2 flex items-center justify-center border-t border-[var(--fifa-border)] pt-2">
                      <span className="text-[10px] text-[var(--fifa-muted)]">
                        You: {pred.home_score}:{pred.away_score} — Awaiting score
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <section>
        <SectionHeader title="Standings" href="/leaderboard" />
        <LiveLeaderboard
          initialEntries={(leaderboard as LeaderboardEntry[]) ?? []}
        />
      </section>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
        {title}
      </h2>
      <Link
        href={href}
        className="text-xs font-semibold text-[var(--fifa-blue-light)] hover:underline"
      >
        View all
      </Link>
    </div>
  );
}
