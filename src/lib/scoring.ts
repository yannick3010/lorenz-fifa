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
