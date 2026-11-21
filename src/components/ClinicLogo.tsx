interface ClinicLogoProps {
  showText?: boolean;
  size?: 'sm' | 'md';
}

export function ClinicLogo({ showText = true, size = 'md' }: ClinicLogoProps) {
  const iconDim = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const textClass =
    size === 'sm'
      ? 'font-display text-lg font-bold tracking-tight text-slate-900'
      : 'font-display text-xl font-bold tracking-tight text-slate-900';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDim} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ajith-clinic-badge" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#ajith-clinic-badge)" />
        {/* Medical Cross Frame */}
        <path
          d="M17 10.5C17 9.67 17.67 9 18.5 9H21.5C22.33 9 23 9.67 23 10.5V17H29.5C30.33 17 31 17.67 31 18.5V21.5C31 22.33 30.33 23 29.5 23H23V29.5C23 30.33 22.33 31 21.5 31H18.5C17.67 31 17 30.33 17 29.5V23H10.5C9.67 23 9 22.33 9 21.5V18.5C9 17.67 9.67 17 10.5 17H17V10.5Z"
          fill="#FFFFFF"
          fillOpacity="0.96"
        />
        {/* Warm Amber Heart/Care Center */}
        <circle cx="20" cy="20" r="3.2" fill="#F59E0B" />
        <circle cx="31.5" cy="8.5" r="2.2" fill="#FBBF24" />
      </svg>

      {showText && <span className={textClass}>Ajith Clinic</span>}
    </span>
  );
}
