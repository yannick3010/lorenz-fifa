import Link from "next/link";
import type { PickUrgency } from "@/lib/urgency";

export type NavTarget = { id: number; urgency: PickUrgency } | null;

// Accent colours match the home-page urgency treatment so a glance at the
// button tells you how soon the next unpicked match kicks off.
const accent: Record<PickUrgency, string> = {
  none: "border-[var(--fifa-border)] bg-[var(--fifa-panel)] text-white hover:border-[var(--fifa-blue)]",
  soon: "border-amber-500/60 bg-amber-500/5 text-amber-200 hover:border-amber-400",
  urgent:
    "border-[var(--fifa-red)]/60 bg-[var(--fifa-red)]/5 text-[var(--fifa-red)] hover:border-[var(--fifa-red)]",
};

export function MatchNav({ prev, next }: { prev: NavTarget; next: NavTarget }) {
  return (
    <nav className="flex items-stretch gap-3 border-t border-[var(--fifa-border)] pt-4">
      <NavButton target={prev} direction="prev" />
      <NavButton target={next} direction="next" />
    </nav>
  );
}

function NavButton({
  target,
  direction,
}: {
  target: NavTarget;
  direction: "prev" | "next";
}) {
  const isPrev = direction === "prev";
  const label = isPrev ? "Previous unpicked" : "Next unpicked";
  const arrow = isPrev ? "←" : "→";
  const align = isPrev ? "justify-start" : "justify-end";

  if (!target) {
    return (
      <span
        aria-disabled
        className={`flex flex-1 items-center ${align} gap-2 rounded-xl border border-[var(--fifa-border)] bg-[var(--fifa-panel)] px-4 py-3 text-sm font-semibold text-[var(--fifa-muted)] opacity-40`}
      >
        {isPrev && <span className="text-base">{arrow}</span>}
        <span>{label}</span>
        {!isPrev && <span className="text-base">{arrow}</span>}
      </span>
    );
  }

  return (
    <Link
      href={`/matches/${target.id}`}
      className={`flex flex-1 items-center ${align} gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${accent[target.urgency]}`}
    >
      {isPrev && <span className="text-base">{arrow}</span>}
      <span>{label}</span>
      {!isPrev && <span className="text-base">{arrow}</span>}
    </Link>
  );
}
