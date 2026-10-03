/** A tied belt, shared by the desktop and mobile dojang identity. */
export function DojangMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M5 17h38v8H5z" fill="currentColor" />
      <path d="m20 23-7 19 9-3 5-15m1-1 9 17 3-9-8-11" fill="currentColor" />
      <path d="m20 15 10 2-2 11-10-2z" fill="currentColor" stroke="white" strokeWidth="2.5" />
      <path d="m15 35 7 2m11-6 5-3" stroke="var(--brand-accent)" strokeWidth="2.5" />
    </svg>
  );
}
