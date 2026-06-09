export type Profile = {
  id: string;
  display_name: string;
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
  created_at: string;
};

export type Prediction = {
  id: number;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points_earned: number | null;
  created_at: string;
  updated_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  matches_scored: number;
  exact_scores: number;
  correct_differences: number;
  correct_winners: number;
  total_predictions: number;
};

export type PredictionWithMatch = Prediction & {
  matches: Match;
};

export type PredictionWithUser = Prediction & {
  profiles: Pick<Profile, "display_name" | "avatar_url">;
};
