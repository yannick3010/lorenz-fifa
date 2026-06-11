"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, full_name")
          .eq("id", user.id)
          .single();
        if (data) {
          setDisplayName(data.display_name);
          setFullName(data.full_name ?? "");
        }
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName, full_name: fullName || null })
        .eq("id", user.id);
      setSaved(true);
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="text-sm text-[var(--fifa-muted)]">Loading...</div>;
  }

  return (
    <form
      onSubmit={handleSave}
      className="max-w-sm rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] p-5"
    >
      <div className="mb-4">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your real name"
          className="w-full rounded-lg border border-[var(--fifa-border)] bg-[var(--fifa-surface)] px-4 py-3 text-sm text-white placeholder-[var(--fifa-muted)] focus:border-[var(--fifa-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--fifa-blue)]"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--fifa-muted)]">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-[var(--fifa-border)] bg-[var(--fifa-surface)] px-4 py-3 text-sm text-white focus:border-[var(--fifa-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--fifa-blue)]"
        />
      </div>

      {saved && (
        <div className="mb-4 rounded-lg border border-[var(--fifa-green)]/30 bg-[var(--fifa-green)]/10 p-3 text-sm text-[var(--fifa-green)]">
          Saved
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-[var(--fifa-blue)] py-3 text-sm font-bold text-white transition hover:bg-[var(--fifa-blue-light)] active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
