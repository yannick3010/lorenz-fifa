"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AdvancePick = "HOME" | "AWAY";

export function PredictionForm({
  matchId,
  isKnockout,
  homeTeam,
  awayTeam,
  existingPrediction,
}: {
  matchId: number;
  isKnockout: boolean;
  homeTeam: string;
  awayTeam: string;
  existingPrediction: {
    home_score: number;
    away_score: number;
    advance_pick: AdvancePick | null;
  } | null;
}) {
  const [homeScore, setHomeScore] = useState(
    existingPrediction ? String(existingPrediction.home_score) : ""
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction ? String(existingPrediction.away_score) : ""
  );
  const [advancePick, setAdvancePick] = useState<AdvancePick | null>(
    existingPrediction?.advance_pick ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(!existingPrediction);
  const router = useRouter();
  const supabase = createClient();

  // A knockout draw can't stand: the user must also say who goes through.
  const isDraw =
    homeScore !== "" && awayScore !== "" && homeScore === awayScore;
  const needsAdvancePick = isKnockout && isDraw;

  function handleScoreChange(
    value: string,
    setter: (next: string) => void
  ) {
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

    if (needsAdvancePick && !advancePick) {
      setError("It's a draw — pick which team advances.");
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
        // Only meaningful for a knockout draw; cleared otherwise.
        advance_pick: needsAdvancePick ? advancePick : null,
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
      setEditing(false);
      router.refresh();
    }

    setSaving(false);
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-[var(--fifa-green)]/30 bg-[var(--fifa-green)]/5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--fifa-green)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="white"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-green)]">
              Pick locked in
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] font-semibold text-[var(--fifa-muted)] transition hover:text-white"
          >
            Edit
          </button>
        </div>

        <div className="flex items-center justify-center gap-5">
          <span className="font-mono text-3xl font-black tabular-nums text-white">
            {homeScore}
          </span>
          <span className="font-mono text-xl text-[var(--fifa-muted)]">:</span>
          <span className="font-mono text-3xl font-black tabular-nums text-white">
            {awayScore}
          </span>
        </div>

        {needsAdvancePick && advancePick && (
          <p className="mt-3 text-center text-xs font-semibold text-[var(--fifa-green)]">
            {advancePick === "HOME" ? homeTeam : awayTeam} to advance
          </p>
        )}

        {saved && (
          <p className="mt-3 text-center text-xs text-[var(--fifa-green)]">
            Prediction updated
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
          {existingPrediction ? "Edit prediction" : "Make your prediction"}
        </p>
        {existingPrediction && (
          <button
            type="button"
            onClick={() => {
              setHomeScore(String(existingPrediction.home_score));
              setAwayScore(String(existingPrediction.away_score));
              setAdvancePick(existingPrediction.advance_pick);
              setEditing(false);
              setError(null);
            }}
            className="text-[11px] font-semibold text-[var(--fifa-muted)] transition hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>

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

      {needsAdvancePick && (
        <div className="mt-5 rounded-lg border border-[var(--fifa-blue)]/30 bg-[var(--fifa-blue)]/5 p-4">
          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-blue-light)]">
            Draw after 90′ — who advances?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["HOME", "AWAY"] as const).map((side) => {
              const team = side === "HOME" ? homeTeam : awayTeam;
              const selected = advancePick === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setAdvancePick(side)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                    selected
                      ? "border-[var(--fifa-blue)] bg-[var(--fifa-blue)] text-white"
                      : "border-[var(--fifa-border)] bg-[var(--fifa-surface)] text-[var(--fifa-muted)] hover:text-white"
                  }`}
                >
                  {team}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-[var(--fifa-red)]/30 bg-[var(--fifa-red)]/10 p-3 text-center text-sm text-[var(--fifa-red)]">
          {error}
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
