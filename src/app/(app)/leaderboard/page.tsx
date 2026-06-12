export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/supabase/types";
import Link from "next/link";

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
    .order("total_points", { ascending: false })
    .order("exact_scores", { ascending: false });

  // PGA-style ranking: players with the same score share a position (T1, T1, ...),
  // and the next player drops by the number of players tied above them. Ties are
  // broken by number of exact scores, so players only share a position when both
  // their total points and exact-score counts match.
  const entries: LeaderboardEntry[] = leaderboard ?? [];
  const sameRank = (a: LeaderboardEntry, b: LeaderboardEntry) =>
    a.total_points === b.total_points && a.exact_scores === b.exact_scores;
  const ranks = entries.map((entry: LeaderboardEntry) => {
    const position =
      entries.findIndex((e: LeaderboardEntry) => sameRank(e, entry)) + 1;
    const tied =
      entries.filter((e: LeaderboardEntry) => sameRank(e, entry)).length > 1;
    return { position, tied };
  });

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
                <span className={`w-8 text-center font-mono text-sm font-bold ${RANK_COLORS[ranks[i].position - 1] ?? "text-[var(--fifa-muted)]"}`}>
                  {ranks[i].tied ? `T${ranks[i].position}` : ranks[i].position}
                </span>
                <Link
                  href={`/players/${entry.user_id}`}
                  className="flex-1 min-w-0 truncate text-sm text-white hover:text-[var(--fifa-blue-light)] transition-colors"
                >
                  <span className="font-semibold">{entry.display_name}</span>
                  {entry.full_name && (
                    <span className="ml-1.5 text-xs text-[var(--fifa-muted)]">
                      ({entry.full_name})
                    </span>
                  )}
                </Link>

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
