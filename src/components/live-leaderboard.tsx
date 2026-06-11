"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/supabase/types";

const RANK_STYLES = [
  "text-[var(--fifa-gold)]",
  "text-[var(--fifa-silver)]",
  "text-[var(--fifa-bronze)]",
];

export function LiveLeaderboard({
  initialEntries,
}: {
  initialEntries: LeaderboardEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "predictions",
        },
        async () => {
          const { data } = await supabase
            .from("leaderboard")
            .select("*")
            .order("total_points", { ascending: false })
            .limit(5);
          if (data) setEntries(data as LeaderboardEntry[]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-[var(--fifa-muted)]">
        No predictions yet. Be the first!
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--fifa-border)] rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] overflow-hidden">
      {entries.map((entry, i) => (
        <div
          key={entry.user_id}
          className="flex items-center gap-3 px-4 py-3"
        >
          <span className={`w-6 text-center font-mono text-sm font-bold ${RANK_STYLES[i] ?? "text-[var(--fifa-muted)]"}`}>
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
          <span className="font-mono text-sm font-bold tabular-nums text-white">
            {entry.total_points}
          </span>
          <span className="text-[10px] font-medium text-[var(--fifa-muted)]">pts</span>
        </div>
      ))}
    </div>
  );
}
