/* A small set of outline icons, drawn inline so the app loads nothing from third parties. */
const PATHS: Record<string, string> = {
  plus: "M12 5v14M5 12h14",
  send: "M12 19V5M5 12l7-7 7 7",
  menu: "M4 7h16M4 12h16M4 17h16",
  x: "M6 6l12 12M18 6L6 18",
  trash: "M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3",
  chart: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 3v18M3 12h18M5.6 5.6l12.8 12.8",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  chevron: "M6 9l6 6 6-6",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5L19 19M5 19l-1.5 1.5M20.5 3.5L19 5M12 8a4 4 0 100 8 4 4 0 000-8z",
  leaf: "M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7",
  heart: "M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z",
  brain: "M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 003 3h1V4H9zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-3 3h-1V4h1z",
  flame: "M12 21a6 6 0 006-6c0-4-3-6-3-9-2 1-4 3-4 6-1-1-2-2-2-4-2 2-3 4-3 7a6 6 0 006 6z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  compass: "M12 3a9 9 0 100 18 9 9 0 000-18zM15 9l-2 4-4 2 2-4 4-2z"
};

export function Icon({ name, size = 18, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}
