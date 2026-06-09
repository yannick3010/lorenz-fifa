"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      window.location.href = "/";
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--fifa-navy)] px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="text-3xl font-black tracking-tight text-white">
              LORENZ
            </span>
            <span className="rounded bg-[var(--fifa-blue)] px-2 py-1 text-sm font-bold tracking-widest text-white">
              26
            </span>
          </div>
          <p className="text-sm font-medium text-[var(--fifa-muted)]">
            FIFA World Cup 2026 Predictions
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-6"
        >
          <h2 className="mb-5 text-lg font-bold text-white">
            {isSignUp ? "Create Account" : "Welcome back"}
          </h2>

          {isSignUp && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--fifa-muted)]">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-[var(--fifa-border)] bg-[var(--fifa-surface)] px-4 py-3 text-sm text-white placeholder-[var(--fifa-muted)] focus:border-[var(--fifa-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--fifa-blue)]"
                placeholder="Your name"
              />
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--fifa-muted)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--fifa-border)] bg-[var(--fifa-surface)] px-4 py-3 text-sm text-white placeholder-[var(--fifa-muted)] focus:border-[var(--fifa-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--fifa-blue)]"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--fifa-muted)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--fifa-border)] bg-[var(--fifa-surface)] px-4 py-3 text-sm text-white placeholder-[var(--fifa-muted)] focus:border-[var(--fifa-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--fifa-blue)]"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-[var(--fifa-red)]/30 bg-[var(--fifa-red)]/10 p-3 text-sm text-[var(--fifa-red)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--fifa-blue)] py-3 text-sm font-bold text-white transition hover:bg-[var(--fifa-blue-light)] disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </button>

          <p className="mt-4 text-center text-xs text-[var(--fifa-muted)]">
            {isSignUp
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-semibold text-[var(--fifa-blue-light)] hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </form>

        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-[var(--fifa-border)]" />
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--fifa-red)]" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--fifa-blue)]" />
          </div>
          <div className="h-px flex-1 bg-[var(--fifa-border)]" />
        </div>
        <p className="mt-3 text-center text-[10px] uppercase tracking-widest text-[var(--fifa-muted)]">
          Canada &middot; Mexico &middot; United States
        </p>
      </div>
    </div>
  );
}
