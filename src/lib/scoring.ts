export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predHome === actualHome && predAway === actualAway) return 3;
  if (predHome - predAway === actualHome - actualAway) return 2;

  const predWinner =
    predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";
  const actualWinner =
    actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";

  if (predWinner === actualWinner) return 1;
  return 0;
}

// Knockout scoring. Predictions are about the 90-minute result; a draw also
// carries an advancer pick. Mirrors public.calculate_points_knockout in SQL
// (which is the source of truth -- scoring runs in the database).
export function calculateKnockoutPoints(
  predHome: number,
  predAway: number,
  advancePick: "HOME" | "AWAY" | null,
  regHome: number,
  regAway: number,
  advancer: "HOME" | "AWAY" | null,
  wentToExtraTime: boolean
): number {
  const predDecisive = predHome !== predAway;
  const predWinner =
    predHome > predAway ? "HOME" : predHome < predAway ? "AWAY" : null;

  if (wentToExtraTime) {
    // Level at 90; advancer decided in extra time / penalties.
    if (predDecisive) return predWinner === advancer ? 1 : 0;
    if (advancePick !== advancer) return 0; // wrong team through
    if (predHome === regHome && predAway === regAway) return 3; // exact draw
    return 2; // right that it was a draw
  }

  // Decided inside 90 minutes; advancer is the regulation winner.
  if (predDecisive) {
    if (predHome === regHome && predAway === regAway) return 3;
    if (predHome - predAway === regHome - regAway) return 2;
    if (predWinner === advancer) return 1;
    return 0;
  }
  // Predicted a draw that didn't happen: credit only if the picked team won.
  return advancePick === advancer ? 1 : 0;
}

export function pointsLabel(points: number): string {
  switch (points) {
    case 3:
      return "Exact";
    case 2:
      return "Difference";
    case 1:
      return "Winner";
    default:
      return "Miss";
  }
}

export function pointsBadgeColor(points: number): string {
  switch (points) {
    case 3:
      return "bg-[var(--fifa-gold)]/20 text-[var(--fifa-gold)]";
    case 2:
      return "bg-[var(--fifa-green)]/20 text-[var(--fifa-green)]";
    case 1:
      return "bg-[var(--fifa-blue-light)]/20 text-[var(--fifa-blue-light)]";
    default:
      return "bg-white/5 text-[var(--fifa-muted)]";
  }
}
