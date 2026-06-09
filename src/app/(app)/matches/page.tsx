export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Match, Prediction } from "@/lib/supabase/types";
import { pointsBadgeColor, pointsLabel } from "@/lib/scoring";
import { TeamName } from "@/components/team-name";
import { Countdown } from "@/components/countdown";

export default async function MatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_time", { ascending: true });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user!.id);

  const predictionMap = new Map<number, Prediction>();
  predictions?.forEach((p: Prediction) => predictionMap.set(p.match_id, p));

  const grouped = groupMatches(matches ?? []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fifa-muted)]">
          All Matches
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white">Schedule</h1>
      </div>

      {Object.entries(grouped).map(([round, roundMatches]) => (
        <section key={round}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--fifa-blue-light)]">
            {round}
          </h2>
          <div className="space-y-1.5">
            {roundMatches.map((match) => {
              const pred = predictionMap.get(match.id);
              const isLive = ["IN_PLAY", "PAUSED", "HALFTIME"].includes(
                match.status
              );
              const isFinished = match.status === "FINISHED";
              const isPast = new Date(match.kickoff_time) <= new Date();

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="block rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-3.5 transition active:scale-[0.98]"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--fifa-red)] opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--fifa-red)]" />
                          </span>
                          <span className="text-[10px] font-bold uppercase text-[var(--fifa-red)]">Live</span>
                        </span>
                      )}
                      {isFinished && (
                        <span className="text-[10px] font-bold uppercase text-[var(--fifa-muted)]">FT</span>
                      )}
                      {!isLive && !isFinished && (
                        <Countdown kickoff={match.kickoff_time} />
                      )}
                    </div>
                    {pred ? (
                      pred.points_earned !== null ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${pointsBadgeColor(
                            pred.points_earned
                          )}`}
                        >
                          +{pred.points_earned} {pointsLabel(pred.points_earned)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[var(--fifa-muted)]">
                          {pred.home_score}:{pred.away_score} picked
                        </span>
                      )
                    ) : !isPast && !isFinished ? (
                      <span className="text-[10px] font-semibold text-[var(--fifa-blue-light)]">
                        Predict
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <TeamName name={match.home_team} />
                    {match.home_score !== null ? (
                      <span className="font-mono text-lg font-black tabular-nums text-white">
                        {match.home_score}
                        <span className="mx-1 text-[var(--fifa-muted)]">:</span>
                        {match.away_score}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[var(--fifa-muted)]">vs</span>
                    )}
                    <TeamName name={match.away_team} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {(!matches || matches.length === 0) && (
        <p className="text-sm text-[var(--fifa-muted)]">
          No matches loaded yet.
        </p>
      )}
    </div>
  );
}

function groupMatches(matches: Match[]): Record<string, Match[]> {
  const groups: Record<string, Match[]> = {};
  for (const match of matches) {
    const key = match.match_group
      ? `Group ${match.match_group}`
      : match.round;
    if (!groups[key]) groups[key] = [];
    groups[key].push(match);
  }
  return groups;
}
