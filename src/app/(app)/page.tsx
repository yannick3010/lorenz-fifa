export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Match, LeaderboardEntry } from "@/lib/supabase/types";
import { LiveMatches } from "@/components/live-matches";
import { LiveLeaderboard } from "@/components/live-leaderboard";
import { PredictionReminder } from "@/components/prediction-reminder";
import { TeamName } from "@/components/team-name";
import { Countdown } from "@/components/countdown";

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

  const { data: recentResults } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "FINISHED")
    .order("kickoff_time", { ascending: false })
    .limit(4);

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
            {upcomingMatches!.map((match: Match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="flex items-center gap-3 rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-3.5 transition active:scale-[0.98]"
              >
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <TeamName name={match.home_team} />
                      <span className="text-xs text-[var(--fifa-muted)]">vs</span>
                      <TeamName name={match.away_team} />
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <Countdown kickoff={match.kickoff_time} />
                  <p className="text-[10px] text-[var(--fifa-muted)]">
                    {match.match_group ? `Group ${match.match_group}` : match.round}
                  </p>
                </div>
              </Link>
            ))}
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
            {recentResults!.map((match: Match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="flex items-center justify-between rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-3.5 transition active:scale-[0.98]"
              >
                <TeamName name={match.home_team} />
                <span className="font-mono text-lg font-black tabular-nums text-white">
                  {match.home_score}
                  <span className="mx-1 text-[var(--fifa-muted)]">:</span>
                  {match.away_score}
                </span>
                <TeamName name={match.away_team} />
              </Link>
            ))}
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
