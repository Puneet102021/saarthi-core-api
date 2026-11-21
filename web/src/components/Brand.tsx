export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="var(--accent)" />
      <path d="M16 6l3 10-3 10-3-10z" fill="var(--saffron)" />
      <circle cx="16" cy="16" r="2.2" fill="#fff" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="brand">
      <Mark />
      <span>Saarthi</span>
    </span>
  );
}
