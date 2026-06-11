export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { MatchLine, PredictionWithUser } from "@/lib/supabase/types";
import { pointsBadgeColor, pointsLabel } from "@/lib/scoring";
import { PredictionForm } from "./prediction-form";
import { MatchLineCard } from "@/components/match-line";
import { getFlagUrl } from "@/components/team-name";
import { Countdown } from "@/components/countdown";
import Link from "next/link";

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

  // Estimated line from the crowd's picks (aggregate only -- see get_match_line).
  let line: MatchLine | null = null;
  if (!isPast) {
    const { data } = await supabase.rpc("get_match_line", {
      p_match_id: match.id,
    });
    line = (data as MatchLine[] | null)?.[0] ?? null;
  }

  let allPredictions: PredictionWithUser[] = [];
  if (isPast) {
    const { data } = await supabase
      .from("predictions")
      .select("*, profiles(display_name, full_name, avatar_url)")
      .eq("match_id", match.id)
      .order("points_earned", { ascending: false });
    allPredictions = (data as PredictionWithUser[]) ?? [];
  }

  const isLive = ["IN_PLAY", "PAUSED", "HALFTIME"].includes(match.status);
  const isFinished = match.status === "FINISHED";

  const homeFlag = getFlagUrl(match.home_team);
  const awayFlag = getFlagUrl(match.away_team);

  return (
    <div className="space-y-6">
      {/* Match header */}
      <div className="rounded-2xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
            {match.round}
            {match.match_group ? ` — Group ${match.match_group}` : ""}
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--fifa-red)] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--fifa-red)]" />
              </span>
              <span className="text-[10px] font-bold uppercase text-[var(--fifa-red)]">Live</span>
            </span>
          )}
          {isFinished && (
            <span className="text-[10px] font-bold uppercase text-[var(--fifa-muted)]">Final</span>
          )}
          {!isPast && <Countdown kickoff={match.kickoff_time} />}
        </div>

        <div className="flex items-center justify-between py-5">
          <div className="flex-1 text-center">
            {homeFlag && (
              <img
                src={homeFlag.replace("w40", "w80")}
                alt=""
                className="mx-auto mb-2 h-10 w-16 rounded object-cover"
              />
            )}
            <p className="text-sm font-bold text-white">{match.home_team}</p>
          </div>

          <div className="px-4 text-center">
            {match.home_score !== null ? (
              <p className="font-mono text-4xl font-black tabular-nums text-white">
                {match.home_score}
                <span className="mx-2 text-[var(--fifa-muted)]">:</span>
                {match.away_score}
              </p>
            ) : (
              <p className="text-xl font-bold text-[var(--fifa-muted)]">vs</p>
            )}
          </div>

          <div className="flex-1 text-center">
            {awayFlag && (
              <img
                src={awayFlag.replace("w40", "w80")}
                alt=""
                className="mx-auto mb-2 h-10 w-16 rounded object-cover"
              />
            )}
            <p className="text-sm font-bold text-white">{match.away_team}</p>
          </div>
        </div>
      </div>

      {/* Prediction form */}
      {!isPast && (
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
      )}

      {/* Live line (consensus from submitted picks) */}
      {!isPast && (
        <MatchLineCard
          line={line}
          homeTeam={match.home_team}
          awayTeam={match.away_team}
        />
      )}

      {/* Your prediction result */}
      {isPast && myPrediction && (
        <div className={`rounded-xl border p-4 ${
          myPrediction.points_earned === 3
            ? "border-[var(--fifa-gold)]/40 bg-[var(--fifa-gold)]/5"
            : myPrediction.points_earned === 2
              ? "border-[var(--fifa-green)]/40 bg-[var(--fifa-green)]/5"
              : myPrediction.points_earned === 1
                ? "border-[var(--fifa-blue-light)]/40 bg-[var(--fifa-blue-light)]/5"
                : "border-[var(--fifa-border)] bg-[var(--fifa-panel)]"
        }`}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
            Your Prediction
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-black tabular-nums text-white">
                {myPrediction.home_score} : {myPrediction.away_score}
              </span>
              {myPrediction.points_earned !== null && (
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-bold ${pointsBadgeColor(
                    myPrediction.points_earned
                  )}`}
                >
                  +{myPrediction.points_earned} {pointsLabel(myPrediction.points_earned)}
                </span>
              )}
            </div>
            {isFinished && match.home_score !== null && (
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">Final</p>
                <p className="font-mono text-lg font-bold tabular-nums text-[var(--fifa-muted)]">
                  {match.home_score} : {match.away_score}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All predictions */}
      {isPast && allPredictions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
            All Predictions
          </h2>
          <div className="divide-y divide-[var(--fifa-border)] rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] overflow-hidden">
            {allPredictions.map((pred) => {
              const rowBorder =
                pred.points_earned === 3
                  ? "border-l-2 border-l-[var(--fifa-gold)]"
                  : pred.points_earned === 2
                    ? "border-l-2 border-l-[var(--fifa-green)]"
                    : pred.points_earned === 1
                      ? "border-l-2 border-l-[var(--fifa-blue-light)]"
                      : "";
              return (
                <div
                  key={pred.id}
                  className={`flex items-center justify-between px-4 py-3 ${rowBorder}`}
                >
                  <Link
                    href={`/players/${pred.user_id}`}
                    className="text-sm text-white hover:text-[var(--fifa-blue-light)] transition-colors"
                  >
                    <span className="font-semibold">{pred.profiles.display_name}</span>
                    {pred.profiles.full_name && (
                      <span className="ml-1.5 text-xs text-[var(--fifa-muted)]">
                        ({pred.profiles.full_name})
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold tabular-nums text-white">
                      {pred.home_score} : {pred.away_score}
                    </span>
                    {pred.points_earned !== null ? (
                      <span
                        className={`min-w-[4.5rem] rounded-md px-2 py-0.5 text-center text-[10px] font-bold ${pointsBadgeColor(
                          pred.points_earned
                        )}`}
                      >
                        +{pred.points_earned} {pointsLabel(pred.points_earned)}
                      </span>
                    ) : (
                      <span className="w-[4.5rem]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {isPast && !myPrediction && (
        <p className="text-sm text-[var(--fifa-muted)]">
          No prediction made for this match.
        </p>
      )}
    </div>
  );
}
