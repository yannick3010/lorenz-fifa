"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function PredictionForm({
  matchId,
  existingPrediction,
}: {
  matchId: number;
  existingPrediction: { home_score: number; away_score: number } | null;
}) {
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.home_score ?? 0
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.away_score ?? 0
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" }
    );

    if (upsertError) {
      setError(
        upsertError.message.includes("kickoff")
          ? "Predictions are locked — the match has started."
          : upsertError.message
      );
    } else {
      setSaved(true);
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-green-900/50 p-6"
    >
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <label className="mb-2 block text-sm text-green-300">Home</label>
          <input
            type="number"
            min={0}
            max={20}
            value={homeScore}
            onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
            className="w-20 rounded-lg border border-green-700 bg-green-950 px-3 py-3 text-center text-2xl font-bold text-white focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>
        <span className="mt-6 text-2xl text-green-600">-</span>
        <div className="text-center">
          <label className="mb-2 block text-sm text-green-300">Away</label>
          <input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
            className="w-20 rounded-lg border border-green-700 bg-green-950 px-3 py-3 text-center text-2xl font-bold text-white focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-200">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 rounded-lg bg-green-500/20 p-3 text-center text-sm text-green-200">
          Prediction saved!
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : existingPrediction
          ? "Update Prediction"
          : "Submit Prediction"}
      </button>
    </form>
  );
}
