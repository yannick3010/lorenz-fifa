import type { MatchLine } from "@/lib/supabase/types";

// "Live line" card: the consensus implied by submitted picks, shown like a
// sportsbook number. Individual picks stay hidden until kickoff -- this only
// ever renders aggregates from get_match_line().
export function MatchLineCard({
  line,
  homeTeam,
  awayTeam,
}: {
  line: MatchLine | null;
  homeTeam: string;
  awayTeam: string;
}) {
  const total = line?.total_picks ?? 0;

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
        Live Line
      </p>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
        {total} {total === 1 ? "pick" : "picks"} in
      </span>
    </div>
  );

  // Below the sample threshold the function returns null counts.
  if (
    !line ||
    line.home_win_count === null ||
    line.draw_count === null ||
    line.away_win_count === null
  ) {
    return (
      <div className="rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-5">
        {header}
        <p className="text-center text-sm text-[var(--fifa-muted)]">
          Not enough picks yet to set a line.
        </p>
      </div>
    );
  }

  const homePct = Math.round((line.home_win_count / total) * 100);
  const drawPct = Math.round((line.draw_count / total) * 100);
  // Derive the last share from the remainder so the three always sum to 100.
  const awayPct = Math.max(0, 100 - homePct - drawPct);

  return (
    <div className="rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-5">
      {header}

      {/* Win-share bar */}
      <div className="flex h-7 w-full overflow-hidden rounded-lg">
        <Segment pct={homePct} className="bg-[var(--fifa-blue)]" />
        <Segment pct={drawPct} className="bg-white/15" />
        <Segment pct={awayPct} className="bg-[var(--fifa-green)]" />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-[var(--fifa-blue-light)]">
          {homeTeam} {homePct}%
        </span>
        <span className="text-[var(--fifa-muted)]">Draw {drawPct}%</span>
        <span className="text-[var(--fifa-green)]">
          {awayTeam} {awayPct}%
        </span>
      </div>

      {line.avg_margin !== null && (
        <div className="mt-4 flex items-center justify-between border-t border-[var(--fifa-border)] pt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
            Consensus spread
          </span>
          <Spread margin={line.avg_margin} homeTeam={homeTeam} awayTeam={awayTeam} />
        </div>
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-[var(--fifa-muted)]">
        Estimated from the crowd&rsquo;s picks. Individual predictions stay
        hidden until kickoff.
      </p>
    </div>
  );
}

function Segment({ pct, className }: { pct: number; className: string }) {
  if (pct <= 0) return null;
  return <div className={className} style={{ width: `${pct}%` }} />;
}

// Vegas-style spread from the average pick margin. By convention the favourite
// lays the points (negative number); a margin of zero is a pick'em.
function Spread({
  margin,
  homeTeam,
  awayTeam,
}: {
  margin: number;
  homeTeam: string;
  awayTeam: string;
}) {
  // numeric can arrive as a string from PostgREST -- normalise before comparing.
  const m = Number(margin);

  if (!m) {
    return (
      <span className="font-mono text-sm font-bold tabular-nums text-white">
        Pick&rsquo;em
      </span>
    );
  }

  const favourite = m > 0 ? homeTeam : awayTeam;
  const spread = `-${Math.abs(m).toFixed(1)}`;

  return (
    <span className="font-mono text-sm font-bold tabular-nums">
      <span className="text-white">{favourite} </span>
      <span className="text-[var(--fifa-green)]">{spread}</span>
    </span>
  );
}
