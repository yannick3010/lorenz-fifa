export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { pointsBadgeColor, pointsLabel } from "@/lib/scoring";
import type { LeaderboardEntry } from "@/lib/supabase/types";
import { getFlagUrl } from "@/components/team-name";
import Link from "next/link";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, full_name, avatar_url, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: stats } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("user_id", id)
    .single();

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*, matches(*)")
    .eq("user_id", id)
    .not("points_earned", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  const entry = stats as LeaderboardEntry | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fifa-muted)]">
          Player
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
          {profile.display_name}
        </h1>
        {profile.full_name && (
          <p className="mt-1 text-sm text-[var(--fifa-muted)]">
            {profile.full_name}
          </p>
        )}
      </div>

      {/* Stats */}
      {entry && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Points" value={entry.total_points} />
          <StatCard
            label="Exact"
            value={entry.exact_scores}
            color="text-[var(--fifa-gold)]"
          />
          <StatCard
            label="Difference"
            value={entry.correct_differences}
            color="text-[var(--fifa-green)]"
          />
          <StatCard
            label="Winner"
            value={entry.correct_winners}
            color="text-[var(--fifa-blue-light)]"
          />
        </div>
      )}

      {/* Recent scored predictions */}
      {predictions && predictions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
            Recent Results
          </h2>
          <div className="divide-y divide-[var(--fifa-border)] rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] overflow-hidden">
            {predictions.map((pred) => {
              const m = pred.matches;
              const homeFlag = getFlagUrl(m.home_team);
              const awayFlag = getFlagUrl(m.away_team);
              return (
                <Link
                  key={pred.id}
                  href={`/matches/${m.id}`}
                  className="flex items-center justify-between gap-2 px-4 py-3 transition hover:bg-white/[0.03]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {homeFlag && (
                      <img src={homeFlag} alt="" className="h-4 w-6 rounded object-cover" />
                    )}
                    <span className="truncate text-xs font-medium text-white">
                      {m.home_team}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-[var(--fifa-muted)]">
                      {m.home_score}:{m.away_score}
                    </span>
                    <span className="truncate text-xs font-medium text-white">
                      {m.away_team}
                    </span>
                    {awayFlag && (
                      <img src={awayFlag} alt="" className="h-4 w-6 rounded object-cover" />
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs font-bold tabular-nums text-white">
                      {pred.home_score}:{pred.away_score}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${pointsBadgeColor(
                        pred.points_earned!
                      )}`}
                    >
                      +{pred.points_earned} {pointsLabel(pred.points_earned!)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {(!predictions || predictions.length === 0) && (
        <p className="text-sm text-[var(--fifa-muted)]">
          No scored predictions yet.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-black tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}
