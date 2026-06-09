export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/lib/supabase/types";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      {(leaderboard?.length ?? 0) > 0 ? (
        <div className="rounded-xl bg-green-900/50 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-green-800 text-sm text-green-300">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-center" title="Exact Scores (3pts)">
                  3pt
                </th>
                <th className="px-4 py-3 text-center" title="Correct Goal Difference (2pts)">
                  2pt
                </th>
                <th className="px-4 py-3 text-center" title="Correct Winner (1pt)">
                  1pt
                </th>
                <th className="px-4 py-3 text-center">Played</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard!.map((entry: LeaderboardEntry, i: number) => (
                <tr
                  key={entry.user_id}
                  className={`border-b border-green-800/50 last:border-0 ${
                    i < 3 ? "bg-green-900/30" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    {i === 0 ? (
                      <span className="text-lg">1st</span>
                    ) : i === 1 ? (
                      <span className="text-lg">2nd</span>
                    ) : i === 2 ? (
                      <span className="text-lg">3rd</span>
                    ) : (
                      <span className="text-green-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-medium text-lg">
                    {entry.display_name}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-400">
                      {entry.exact_scores}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-400">
                      {entry.correct_differences}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">
                      {entry.correct_winners}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-green-400">
                    {entry.matches_scored}
                  </td>
                  <td className="px-4 py-4 text-right text-xl font-bold">
                    {entry.total_points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-green-400">
          No scores yet. Make some predictions and check back once matches finish!
        </p>
      )}
    </div>
  );
}
