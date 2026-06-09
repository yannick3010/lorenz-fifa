"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm() {
  const supabase = createClient();
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
          .select("display_name")
          .eq("id", user.id)
          .single();
        if (data) setDisplayName(data.display_name);
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
        .update({ display_name: displayName })
        .eq("id", user.id);
      setSaved(true);
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="text-green-400">Loading...</div>;
  }

  return (
    <form
      onSubmit={handleSave}
      className="max-w-md rounded-xl bg-green-900/50 p-6"
    >
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-green-300">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 text-white focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
        />
      </div>

      {saved && (
        <div className="mb-4 rounded-lg bg-green-500/20 p-3 text-sm text-green-200">
          Profile updated!
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
