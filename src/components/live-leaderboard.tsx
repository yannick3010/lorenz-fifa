"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/lib/supabase/types";

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
      <p className="text-green-400">
        No predictions yet. Be the first to make one!
      </p>
    );
  }

  return (
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
          {entries.map((entry, i) => (
            <tr
              key={entry.user_id}
              className="border-b border-green-800/50 last:border-0"
            >
              <td className="px-4 py-3 font-mono text-green-400">{i + 1}</td>
              <td className="px-4 py-3 font-medium">{entry.display_name}</td>
              <td className="px-4 py-3 text-right font-bold">
                {entry.total_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
