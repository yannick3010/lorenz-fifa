"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Match } from "@/lib/supabase/types";
import { TeamName } from "@/components/team-name";

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
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--fifa-red)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--fifa-red)]" />
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--fifa-red)]">
          Live
        </h2>
      </div>
      <div className="grid gap-3">
        {liveMatches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="block rounded-xl border border-[var(--fifa-red)]/20 bg-[var(--fifa-panel)] p-4 transition active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <TeamName name={match.home_team} />
              <span className="font-mono text-2xl font-black tabular-nums text-white">
                {match.home_score ?? 0}
                <span className="mx-1.5 text-[var(--fifa-muted)]">:</span>
                {match.away_score ?? 0}
              </span>
              <TeamName name={match.away_team} />
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
