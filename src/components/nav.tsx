"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Home" },
  { href: "/matches", label: "Matches" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
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
    <nav className="border-b border-green-800 bg-green-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-white">
          Lorenz FIFA
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-green-800 text-white"
                  : "text-green-300 hover:bg-green-900 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-green-400 transition hover:bg-green-900 hover:text-white"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-green-300 transition-transform ${
              open ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-green-300 transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-green-300 transition-transform ${
              open ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-green-800 px-4 pb-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-3 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-green-800 text-white"
                  : "text-green-300 hover:bg-green-900 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="mt-1 block w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-green-400 transition hover:bg-green-900 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
