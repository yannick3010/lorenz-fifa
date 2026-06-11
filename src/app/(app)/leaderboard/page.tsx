export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/supabase/types";

const RANK_COLORS = [
  "text-[var(--fifa-gold)]",
  "text-[var(--fifa-silver)]",
  "text-[var(--fifa-bronze)]",
];

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fifa-muted)]">
          Rankings
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white">Standings</h1>
      </div>

      {(leaderboard?.length ?? 0) > 0 ? (
        <>
          {/* Top 3 podium on mobile */}
          {leaderboard!.length >= 1 && (
            <div className="flex items-end justify-center gap-3 py-2 md:hidden">
              {leaderboard!.length >= 2 && (
                <PodiumCard entry={leaderboard![1]} rank={2} height="h-20" />
              )}
              <PodiumCard entry={leaderboard![0]} rank={1} height="h-28" />
              {leaderboard!.length >= 3 && (
                <PodiumCard entry={leaderboard![2]} rank={3} height="h-16" />
              )}
            </div>
          )}

          {/* Full table */}
          <div className="divide-y divide-[var(--fifa-border)] rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] overflow-hidden">
            {/* Header - desktop only */}
            <div className="hidden items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)] md:flex">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Player</span>
              <span className="w-12 text-center">Exact</span>
              <span className="w-12 text-center">Diff</span>
              <span className="w-12 text-center">Win</span>
              <span className="w-12 text-center">Played</span>
              <span className="w-14 text-right">Points</span>
            </div>

            {leaderboard!.map((entry: LeaderboardEntry, i: number) => (
              <div
                key={entry.user_id}
                className="flex items-center gap-2 px-4 py-3.5"
              >
                <span className={`w-8 text-center font-mono text-sm font-bold ${RANK_COLORS[i] ?? "text-[var(--fifa-muted)]"}`}>
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm text-white">
                  <span className="font-semibold">{entry.display_name}</span>
                  {entry.full_name && (
                    <span className="ml-1.5 text-xs text-[var(--fifa-muted)]">
                      ({entry.full_name})
                    </span>
                  )}
                </span>

                {/* Desktop stat columns */}
                <span className="hidden w-12 text-center md:block">
                  <span className="rounded-md bg-[var(--fifa-gold)]/10 px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--fifa-gold)]">
                    {entry.exact_scores}
                  </span>
                </span>
                <span className="hidden w-12 text-center md:block">
                  <span className="rounded-md bg-[var(--fifa-green)]/10 px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--fifa-green)]">
                    {entry.correct_differences}
                  </span>
                </span>
                <span className="hidden w-12 text-center md:block">
                  <span className="rounded-md bg-[var(--fifa-blue-light)]/10 px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--fifa-blue-light)]">
                    {entry.correct_winners}
                  </span>
                </span>
                <span className="hidden w-12 text-center font-mono text-xs text-[var(--fifa-muted)] md:block">
                  {entry.matches_scored}
                </span>

                {/* Mobile: just points. Desktop: bold points */}
                <div className="w-14 text-right">
                  <span className="font-mono text-base font-black tabular-nums text-white">
                    {entry.total_points}
                  </span>
                  <span className="ml-0.5 text-[10px] text-[var(--fifa-muted)] md:hidden">pts</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--fifa-muted)]">
          No scores yet. Make some predictions and check back once matches finish!
        </p>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  rank,
  height,
}: {
  entry: LeaderboardEntry;
  rank: number;
  height: string;
}) {
  const colors = {
    1: "border-[var(--fifa-gold)]/40 bg-[var(--fifa-gold)]/5",
    2: "border-[var(--fifa-silver)]/30 bg-[var(--fifa-silver)]/5",
    3: "border-[var(--fifa-bronze)]/30 bg-[var(--fifa-bronze)]/5",
  };

  return (
    <div
      className={`flex w-24 flex-col items-center justify-end rounded-xl border ${
        colors[rank as keyof typeof colors]
      } ${height} px-2 pb-3`}
    >
      <span className={`font-mono text-xs font-bold ${RANK_COLORS[rank - 1]}`}>
        {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
      </span>
      <span className="mt-1 w-full truncate text-center text-xs font-bold text-white">
        {entry.display_name}
      </span>
      {entry.full_name && (
        <span className="w-full truncate text-center text-[9px] text-[var(--fifa-muted)]">
          {entry.full_name}
        </span>
      )}
      <span className="mt-0.5 font-mono text-lg font-black text-white">
        {entry.total_points}
      </span>
    </div>
  );
}
