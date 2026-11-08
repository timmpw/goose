import { cn } from '../../utils';

interface BrandSpinnerProps {
  className?: string;
  /**
   * `spin` — the agent is busy (thinking, streaming, loading, compacting).
   * `waiting` — the agent stopped for the user: the same ring, pulsing
   * instead of turning, so it does not read as "still working".
   */
  variant?: 'spin' | 'waiting';
  label?: string;
}

// The 10router busy indicator: a thin ring with a brand-blue arc on a pale
// track. Blue comes from --color-text-info (#1E5AE6 light, #4A7EF7 dark), so
// it reads on both cabinet themes. Size it with h-*/w-* in className.
export function BrandSpinner({ className, variant = 'spin', label }: BrandSpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'h-4 w-4 flex-shrink-0 text-text-info',
        variant === 'spin' ? 'animate-spin [animation-duration:0.8s]' : 'animate-pulse',
        className
      )}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      {variant === 'spin' ? (
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      )}
    </svg>
  );
}
