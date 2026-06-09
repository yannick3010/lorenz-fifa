"use client";

import { useEffect, useState } from "react";

export function Countdown({ kickoff }: { kickoff: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(kickoff).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Started");
        setUrgent(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }

      setUrgent(diff < 1000 * 60 * 60);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [kickoff]);

  if (!timeLeft) return null;

  return (
    <span
      className={`font-mono text-sm ${
        urgent ? "text-red-400 font-semibold" : "text-green-400"
      }`}
    >
      {timeLeft}
    </span>
  );
}
