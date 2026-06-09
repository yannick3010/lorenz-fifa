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
      return "Exact Score";
    case 2:
      return "Goal Difference";
    case 1:
      return "Correct Winner";
    default:
      return "Wrong";
  }
}

export function pointsBadgeColor(points: number): string {
  switch (points) {
    case 3:
      return "bg-yellow-500 text-yellow-950";
    case 2:
      return "bg-green-500 text-green-950";
    case 1:
      return "bg-blue-500 text-blue-950";
    default:
      return "bg-gray-500 text-gray-100";
  }
}
