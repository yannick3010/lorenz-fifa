export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Match, Prediction } from "@/lib/supabase/types";
import { pointsBadgeColor, pointsLabel } from "@/lib/scoring";

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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Matches</h1>

      {Object.entries(grouped).map(([round, roundMatches]) => (
        <section key={round}>
          <h2 className="mb-4 text-lg font-semibold text-green-300">
            {round}
          </h2>
          <div className="space-y-2">
            {roundMatches.map((match) => {
              const pred = predictionMap.get(match.id);
              const isLive = ["IN_PLAY", "PAUSED", "HALFTIME"].includes(
                match.status
              );
              const isFinished = match.status === "FINISHED";
              const isPast = new Date(match.kickoff_time) <= new Date();
              const kickoff = new Date(match.kickoff_time);

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center justify-between rounded-xl bg-green-900/50 p-4 transition hover:bg-green-900/70"
                >
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2 text-xs text-green-400">
                      {match.match_group && (
                        <span>Group {match.match_group}</span>
                      )}
                      <span>
                        {kickoff.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {kickoff.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isLive && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 font-bold text-white">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-base font-semibold">
                      <span>{match.home_team}</span>
                      {match.home_score !== null ? (
                        <span className="font-mono text-lg">
                          {match.home_score} - {match.away_score}
                        </span>
                      ) : (
                        <span className="text-green-600">vs</span>
                      )}
                      <span>{match.away_team}</span>
                    </div>
                  </div>

                  <div className="ml-4 text-right text-sm">
                    {pred ? (
                      <div>
                        <div className="text-green-300">
                          Your pick: {pred.home_score} - {pred.away_score}
                        </div>
                        {pred.points_earned !== null && (
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${pointsBadgeColor(
                              pred.points_earned
                            )}`}
                          >
                            {pred.points_earned}pts — {pointsLabel(pred.points_earned)}
                          </span>
                        )}
                      </div>
                    ) : isPast || isFinished ? (
                      <span className="text-green-600">No prediction</span>
                    ) : (
                      <span className="text-green-400">Make prediction &rarr;</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {(!matches || matches.length === 0) && (
        <p className="text-green-400">
          No matches loaded yet. An admin needs to sync the schedule.
        </p>
      )}
    </div>
  );
}

function groupMatches(matches: Match[]): Record<string, Match[]> {
  const groups: Record<string, Match[]> = {};
  for (const match of matches) {
    const key = match.match_group
      ? `Group Stage — Group ${match.match_group}`
      : match.round;
    if (!groups[key]) groups[key] = [];
    groups[key].push(match);
  }
  return groups;
}
