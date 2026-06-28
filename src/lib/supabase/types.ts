export type Profile = {
  id: string;
  display_name: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Match = {
  id: number;
  external_id: number | null;
  round: string;
  match_group: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_time: string;
  status: string;
  // Knockout result metadata from the football-data API. winner is the team
  // that advanced; duration tells us whether the match went past 90 minutes.
  // home_score/away_score always hold the 90-minute (regulation) score.
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | null;
  created_at: string;
};

export type AdvancePick = "HOME" | "AWAY";

export type Prediction = {
  id: number;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  // For a knockout draw prediction, which team the user picked to advance.
  // Null for decisive picks and all group-stage predictions.
  advance_pick: AdvancePick | null;
  points_earned: number | null;
  created_at: string;
  updated_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  matches_scored: number;
  exact_scores: number;
  correct_differences: number;
  correct_winners: number;
  total_predictions: number;
};

// Aggregate row returned by the get_match_line() RPC. Below the minimum-sample
// threshold every field except total_picks is null (line not yet revealed).
export type MatchLine = {
  total_picks: number;
  home_win_count: number | null;
  draw_count: number | null;
  away_win_count: number | null;
  // Consensus spread: average of (home_score - away_score) across all picks.
  // Positive favours the home team, negative favours the away team.
  avg_margin: number | null;
};

export type PredictionWithMatch = Prediction & {
  matches: Match;
};

export type PredictionWithUser = Prediction & {
  profiles: Pick<Profile, "display_name" | "full_name" | "avatar_url">;
};
