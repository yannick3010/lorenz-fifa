export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Match, LeaderboardEntry } from "@/lib/supabase/types";

export default async function HomePage() {
  const supabase = await createClient();

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

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">World Cup 2026</h1>
        <p className="mt-1 text-green-300">
          Predict scores. Earn points. Beat your family.
        </p>
      </div>

      {(liveMatches?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-red-400">
            Live Now
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {liveMatches!.map((match: Match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Matches</h2>
          <Link
            href="/matches"
            className="text-sm text-green-400 hover:underline"
          >
            View all
          </Link>
        </div>
        {(upcomingMatches?.length ?? 0) > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingMatches!.map((match: Match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-green-400">No upcoming matches yet.</p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Leaderboard</h2>
          <Link
            href="/leaderboard"
            className="text-sm text-green-400 hover:underline"
          >
            Full standings
          </Link>
        </div>
        {(leaderboard?.length ?? 0) > 0 ? (
          <div className="rounded-xl bg-green-900/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-green-800 text-sm text-green-300">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard!.map((entry: LeaderboardEntry, i: number) => (
                  <tr
                    key={entry.user_id}
                    className="border-b border-green-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-green-400">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {entry.display_name}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {entry.total_points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-green-400">
            No predictions yet. Be the first to make one!
          </p>
        )}
      </section>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isLive = ["IN_PLAY", "PAUSED", "HALFTIME"].includes(match.status);
  const kickoff = new Date(match.kickoff_time);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-xl bg-green-900/50 p-4 transition hover:bg-green-900/70"
    >
      <div className="mb-2 flex items-center justify-between text-xs text-green-400">
        <span>{match.round}{match.match_group ? ` - Group ${match.match_group}` : ""}</span>
        {isLive ? (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            LIVE
          </span>
        ) : (
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
        )}
      </div>
      <div className="flex items-center justify-between text-lg font-semibold">
        <span>{match.home_team}</span>
        {match.home_score !== null ? (
          <span className="font-mono">
            {match.home_score} - {match.away_score}
          </span>
        ) : (
          <span className="text-green-600">vs</span>
        )}
        <span>{match.away_team}</span>
      </div>
    </Link>
  );
}
