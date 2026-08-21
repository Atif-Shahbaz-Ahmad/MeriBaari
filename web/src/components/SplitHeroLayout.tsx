import type { ReactNode } from 'react';

import { HeroFallbackArt } from '@web/components/HeroFallbackArt';

/**
 * Full-viewport two-pane shell: image left, content right.
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
    <main className="fixed inset-0 flex overflow-hidden bg-surface text-ink">
      <div className="relative hidden h-full w-1/2 overflow-hidden md:block">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <HeroFallbackArt />
        )}
      </div>
      <div className="relative z-10 flex h-full w-full flex-col justify-center overflow-hidden px-6 py-6 sm:px-10 md:w-1/2 md:px-12">
        {children}
      </div>
    </main>
  );
}
