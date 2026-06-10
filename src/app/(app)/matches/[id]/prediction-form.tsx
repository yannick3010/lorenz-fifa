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
    existingPrediction ? String(existingPrediction.home_score) : ""
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction ? String(existingPrediction.away_score) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function handleScoreChange(
    value: string,
    setter: (next: string) => void
  ) {
    // Strip anything that isn't a digit so the field stays numeric.
    const digits = value.replace(/\D/g, "");
    if (digits === "") {
      setter("");
      return;
    }
    const clamped = Math.min(parseInt(digits, 10), 20);
    setter(String(clamped));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (homeScore === "" || awayScore === "") {
      setError("Enter a score for both teams.");
      return;
    }

    setSaving(true);

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
        home_score: parseInt(homeScore, 10),
        away_score: parseInt(awayScore, 10),
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
      className="rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-5"
    >
      <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
        {existingPrediction ? "Update prediction" : "Make your prediction"}
      </p>

      <div className="flex items-center justify-center gap-5">
        <div className="text-center">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
            Home
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="0"
            value={homeScore}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleScoreChange(e.target.value, setHomeScore)}
            className="w-20 rounded-lg border border-[var(--fifa-border)] bg-[var(--fifa-surface)] px-3 py-3 text-center font-mono text-2xl font-bold text-white placeholder:text-[var(--fifa-muted)] focus:border-[var(--fifa-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--fifa-blue)]"
          />
        </div>
        <span className="mt-6 font-mono text-xl text-[var(--fifa-muted)]">:</span>
        <div className="text-center">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
            Away
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            placeholder="0"
            value={awayScore}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleScoreChange(e.target.value, setAwayScore)}
            className="w-20 rounded-lg border border-[var(--fifa-border)] bg-[var(--fifa-surface)] px-3 py-3 text-center font-mono text-2xl font-bold text-white placeholder:text-[var(--fifa-muted)] focus:border-[var(--fifa-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--fifa-blue)]"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-[var(--fifa-red)]/30 bg-[var(--fifa-red)]/10 p-3 text-center text-sm text-[var(--fifa-red)]">
          {error}
        </div>
      )}

      {saved && (
        <div className="mt-4 rounded-lg border border-[var(--fifa-green)]/30 bg-[var(--fifa-green)]/10 p-3 text-center text-sm text-[var(--fifa-green)]">
          Prediction saved
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-lg bg-[var(--fifa-blue)] py-3 text-sm font-bold text-white transition hover:bg-[var(--fifa-blue-light)] active:scale-[0.98] disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : existingPrediction
          ? "Update"
          : "Lock it in"}
      </button>
    </form>
  );
}
