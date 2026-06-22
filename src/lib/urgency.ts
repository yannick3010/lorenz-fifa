export type PickUrgency = "none" | "soon" | "urgent";

// How urgent it is to make a pick, based on time to kickoff. Mirrors the home
// page treatment: a match the user hasn't picked turns amber within 24h and red
// within 1h. Anything already picked, started, or further out is "none".
export function pickUrgency(kickoffTime: string, hasPick: boolean): PickUrgency {
  if (hasPick) return "none";
  const hoursUntil =
    (new Date(kickoffTime).getTime() - Date.now()) / 3_600_000;
  if (hoursUntil <= 0) return "none";
  if (hoursUntil < 1) return "urgent";
  if (hoursUntil < 24) return "soon";
  return "none";
}
