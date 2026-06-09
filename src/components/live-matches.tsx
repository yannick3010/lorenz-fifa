"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Match } from "@/lib/supabase/types";

export function LiveMatches({ initialMatches }: { initialMatches: Match[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("live-matches")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          const updated = payload.new as Match;
          setMatches((prev) =>
            prev.some((m) => m.id === updated.id)
              ? prev.map((m) => (m.id === updated.id ? updated : m))
              : isLive(updated)
              ? [...prev, updated]
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const liveMatches = matches.filter((m) => isLive(m));

  if (liveMatches.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-red-400">Live Now</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {liveMatches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="block rounded-xl border border-red-500/30 bg-green-900/50 p-4 transition hover:bg-green-900/70"
          >
            <div className="mb-2 flex items-center justify-between text-xs text-green-400">
              <span>
                {match.round}
                {match.match_group ? ` - Group ${match.match_group}` : ""}
              </span>
              <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                LIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>{match.home_team}</span>
              <span className="font-mono text-xl">
                {match.home_score ?? 0} - {match.away_score ?? 0}
              </span>
              <span>{match.away_team}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function isLive(match: Match): boolean {
  return ["IN_PLAY", "PAUSED", "HALFTIME"].includes(match.status);
}
