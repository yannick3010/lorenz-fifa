"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Match } from "@/lib/supabase/types";

export function PredictionReminder() {
  const [unpredicted, setUnpredicted] = useState<Match[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const soon = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const { data: upcomingMatches } = await supabase
        .from("matches")
        .select("*")
        .in("status", ["TIMED", "SCHEDULED"])
        .gt("kickoff_time", now.toISOString())
        .lt("kickoff_time", soon.toISOString())
        .order("kickoff_time", { ascending: true });

      if (!upcomingMatches?.length) return;

      const { data: predictions } = await supabase
        .from("predictions")
        .select("match_id")
        .eq("user_id", user.id)
        .in(
          "match_id",
          upcomingMatches.map((m) => m.id)
        );

      const predictedIds = new Set(predictions?.map((p) => p.match_id) ?? []);
      setUnpredicted(
        upcomingMatches.filter((m) => !predictedIds.has(m.id))
      );
    }

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [supabase]);

  const visible = unpredicted.filter((m) => !dismissed.has(m.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((match) => {
        const kickoff = new Date(match.kickoff_time);
        const minutesUntil = Math.round(
          (kickoff.getTime() - Date.now()) / (1000 * 60)
        );

        return (
          <div
            key={match.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--fifa-gold)]/20 bg-[var(--fifa-gold)]/5 px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--fifa-gold)]">
                {minutesUntil < 60
                  ? `${minutesUntil}m to kickoff`
                  : `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m to kickoff`}
              </p>
              <p className="truncate text-sm text-white/80">
                {match.home_team} vs {match.away_team}
              </p>
            </div>
            <Link
              href={`/matches/${match.id}`}
              className="shrink-0 rounded-lg bg-[var(--fifa-gold)] px-3 py-1.5 text-xs font-bold text-[var(--fifa-navy)] transition hover:brightness-110"
            >
              Predict
            </Link>
            <button
              onClick={() =>
                setDismissed((prev) => new Set([...prev, match.id]))
              }
              className="shrink-0 text-[var(--fifa-muted)] hover:text-white"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
