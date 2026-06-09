export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { PredictionWithUser } from "@/lib/supabase/types";
import { pointsBadgeColor, pointsLabel } from "@/lib/scoring";
import { PredictionForm } from "./prediction-form";
import { TeamName, getFlagUrl } from "@/components/team-name";
import { Countdown } from "@/components/countdown";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) notFound();

  const { data: myPrediction } = await supabase
    .from("predictions")
    .select("*")
    .eq("match_id", match.id)
    .eq("user_id", user!.id)
    .single();

  const isPast = new Date(match.kickoff_time) <= new Date();

  let allPredictions: PredictionWithUser[] = [];
  if (isPast) {
    const { data } = await supabase
      .from("predictions")
      .select("*, profiles(display_name, avatar_url)")
      .eq("match_id", match.id)
      .order("points_earned", { ascending: false });
    allPredictions = (data as PredictionWithUser[]) ?? [];
  }

  const isLive = ["IN_PLAY", "PAUSED", "HALFTIME"].includes(match.status);
  const isFinished = match.status === "FINISHED";

  const homeFlag = getFlagUrl(match.home_team);
  const awayFlag = getFlagUrl(match.away_team);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-green-900/50 p-6">
        <div className="mb-2 flex items-center justify-between text-sm text-green-400">
          <span>
            {match.round}
            {match.match_group ? ` — Group ${match.match_group}` : ""}
          </span>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                LIVE
              </span>
            )}
            {isFinished && (
              <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                FINAL
              </span>
            )}
            {!isPast && <Countdown kickoff={match.kickoff_time} />}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 py-4 sm:gap-10">
          <div className="text-center">
            {homeFlag && (
              <img
                src={homeFlag.replace("w40", "w80")}
                alt={`${match.home_team} flag`}
                className="mx-auto mb-2 h-10 w-16 rounded object-cover shadow"
              />
            )}
            <div className="text-xl font-bold sm:text-2xl">{match.home_team}</div>
          </div>
          <div className="text-center">
            {match.home_score !== null ? (
              <div className="text-4xl font-bold font-mono sm:text-5xl">
                {match.home_score} - {match.away_score}
              </div>
            ) : (
              <div className="text-2xl text-green-600">vs</div>
            )}
          </div>
          <div className="text-center">
            {awayFlag && (
              <img
                src={awayFlag.replace("w40", "w80")}
                alt={`${match.away_team} flag`}
                className="mx-auto mb-2 h-10 w-16 rounded object-cover shadow"
              />
            )}
            <div className="text-xl font-bold sm:text-2xl">{match.away_team}</div>
          </div>
        </div>
      </div>

      {!isPast && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Your Prediction</h2>
          <PredictionForm
            matchId={match.id}
            existingPrediction={
              myPrediction
                ? {
                    home_score: myPrediction.home_score,
                    away_score: myPrediction.away_score,
                  }
                : null
            }
          />
        </section>
      )}

      {isPast && myPrediction && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Your Prediction</h2>
          <div className="rounded-xl bg-green-900/50 p-4">
            <span className="text-lg font-mono font-semibold">
              {myPrediction.home_score} - {myPrediction.away_score}
            </span>
            {myPrediction.points_earned !== null && (
              <span
                className={`ml-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${pointsBadgeColor(
                  myPrediction.points_earned
                )}`}
              >
                {myPrediction.points_earned}pts — {pointsLabel(myPrediction.points_earned)}
              </span>
            )}
          </div>
        </section>
      )}

      {isPast && allPredictions.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">All Predictions</h2>
          <div className="rounded-xl bg-green-900/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-green-800 text-sm text-green-300">
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-center">Prediction</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {allPredictions.map((pred) => (
                  <tr
                    key={pred.id}
                    className="border-b border-green-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {pred.profiles.display_name}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {pred.home_score} - {pred.away_score}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pred.points_earned !== null ? (
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${pointsBadgeColor(
                            pred.points_earned
                          )}`}
                        >
                          {pred.points_earned}pts
                        </span>
                      ) : (
                        <span className="text-green-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isPast && !myPrediction && (
        <p className="text-green-500">
          You didn&apos;t make a prediction for this match.
        </p>
      )}
    </div>
  );
}
