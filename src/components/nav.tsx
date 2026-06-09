"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { href: "/matches", label: "Matches", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/leaderboard", label: "Standings", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export function Nav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:block border-b border-[var(--fifa-border)] bg-[var(--fifa-panel)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">
              LORENZ
            </span>
            <span className="rounded bg-[var(--fifa-blue)] px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-white">
              26
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  pathname === link.href
                    ? "bg-[var(--fifa-blue)] text-white"
                    : "text-[var(--fifa-muted)] hover:bg-[var(--fifa-surface)] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="ml-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--fifa-muted)] transition hover:bg-[var(--fifa-surface)] hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--fifa-border)] bg-[var(--fifa-panel)]/95 backdrop-blur-lg md:hidden safe-bottom">
        <div className="flex items-stretch justify-around">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-semibold transition ${
                  active
                    ? "text-white"
                    : "text-[var(--fifa-muted)]"
                }`}
              >
                <svg
                  className={`h-5 w-5 ${active ? "text-[var(--fifa-blue-light)]" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={active ? 2.5 : 1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                {link.label}
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--fifa-blue-light)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
