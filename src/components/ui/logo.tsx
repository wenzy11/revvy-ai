export function RevvyLogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M3.5 13.1c0-4.7 3.8-8.6 8.5-8.6 2.2 0 4.2.8 5.7 2.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20.5 10.9c0 4.7-3.8 8.6-8.5 8.6-2.2 0-4.2-.8-5.7-2.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.1 15.4 16.5 7.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="8.1" cy="15.4" r="1.3" fill="currentColor" />
      <circle cx="16.5" cy="7.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function RevvyLogo({ className = "h-6" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="text-[color:var(--brand)]">
        <RevvyLogoMark className="h-6 w-6" />
      </div>
      <div className="leading-none">
        <div className="text-sm font-semibold tracking-wide text-blue-950">
          Revvy AI
        </div>
        <div className="text-[10px] font-medium text-[color:var(--muted)]">
          studio-grade edits
        </div>
      </div>
    </div>
  );
}
