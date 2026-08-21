import type { ReactNode } from 'react';

import { HeroFallbackArt } from '@web/components/HeroFallbackArt';

/**
 * Two-pane shell: image left, content right.
 * Occupies 80% of the viewport (10% blank margin on each side) with 25% corner radius.
 * Drop any photo in `web/public/` as `hero.jpg` (or png/webp/svg/…).
 */
export function SplitHeroLayout({
  imageSrc,
  children,
}: {
  imageSrc: string | null;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-dvh bg-surface text-ink">
      <div className="fixed inset-[10%] flex flex-col overflow-hidden rounded-[25%] bg-surface-card shadow-2xl md:flex-row">
        <div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-44 md:h-full md:w-1/2">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt="Skip the wait with MeriBaari"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <HeroFallbackArt />
          )}
        </div>
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-center overflow-y-auto px-6 py-4 sm:px-8 md:w-1/2 md:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}