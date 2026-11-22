import type { Challenge } from "@/lib/content";

export function CloudShape({ ch }: { ch: Pick<Challenge, "id" | "colors"> }) {
  return (
    <svg viewBox="0 0 300 190" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`g-${ch.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ch.colors[0]} />
          <stop offset="1" stopColor={ch.colors[1]} />
        </linearGradient>
      </defs>
      <g fill={`url(#g-${ch.id})`}>
        <circle cx="88" cy="96" r="58" />
        <circle cx="150" cy="70" r="66" />
        <circle cx="214" cy="92" r="56" />
        <circle cx="54" cy="128" r="42" />
        <circle cx="250" cy="128" r="40" />
        <rect x="46" y="100" width="210" height="70" rx="35" />
      </g>
    </svg>
  );
}
