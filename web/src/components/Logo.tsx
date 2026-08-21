/**
 * MeriBaari wordmark. Default `auto` follows the page theme via CSS:
 * light backgrounds get the dark mark, dark backgrounds get the bright mark.
 * Pass `light` / `dark` only when the logo sits on a forced background.
 */
export function LogoMark({
  size = 40,
  variant = 'auto',
}: {
  size?: number;
  variant?: 'auto' | 'light' | 'dark' | 'onPrimary';
}) {
  const figureFill =
    variant === 'light'
      ? 'fill-primary'
      : variant === 'dark' || variant === 'onPrimary'
        ? 'fill-white'
        : 'fill-primary dark:fill-white';
  const figureStroke =
    variant === 'light'
      ? 'stroke-primary'
      : variant === 'dark' || variant === 'onPrimary'
        ? 'stroke-white'
        : 'stroke-primary dark:stroke-white';

  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" aria-hidden>
      <circle cx="36" cy="30" r="13" className={figureFill} />
      <circle cx="92" cy="30" r="13" className={figureFill} />
      <path
        d="M20 52c1-3 4-5 8-5h16c10 0 18 7 20 17 3 12 1 26-5 36-3 5-8 8-14 8H31c-7 0-12-6-11-13 2-16 0-32 0-43z"
        className={figureFill}
      />
      <path
        d="M108 52c-1-3-4-5-8-5H84c-10 0-18 7-20 17-3 12-1 26 5 36 3 5 8 8 14 8h14c7 0 12-6 11-13-2-16 0-32 0-43z"
        className={figureFill}
      />
      <path
        d="M48 58c10 12 14 22 16 34"
        className={figureStroke}
        strokeWidth={11}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M80 58c-10 12-14 22-16 34"
        className={figureStroke}
        strokeWidth={11}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 94l10 10 20-22"
        className="stroke-secondary"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  variant = 'auto',
  showTagline = true,
}: {
  variant?: 'auto' | 'light' | 'dark';
  showTagline?: boolean;
}) {
  const meri =
    variant === 'light'
      ? 'text-ink'
      : variant === 'dark'
        ? 'text-white'
        : 'text-ink';

  return (
    <div className="flex items-center gap-3">
      <LogoMark size={40} variant={variant} />
      <div>
        <p className="text-xl font-bold leading-none">
          <span className={meri}>Meri</span>
          <span className="text-primary">Baari</span>
        </p>
        {showTagline ? (
          <p className="mt-1 text-xs font-medium text-secondary">My Turn</p>
        ) : null}
      </div>
    </div>
  );
}
