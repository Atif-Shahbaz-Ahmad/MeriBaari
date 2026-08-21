import type { ReactNode } from 'react';

import { HeroFallbackArt } from '@web/components/HeroFallbackArt';

/**
 * Two-pane marketing/auth shell: image on the left, content on the right.
 * Any photo dropped in as `web/public/hero.jpg` (or png/webp/svg/…) covers the
 * left pane via object-fit, so aspect ratio does not matter.
 */
export function SplitHeroLayout({
  imageSrc,
  children,
}: {
  imageSrc: string | null;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5C518] px-4 py-8 dark:bg-slate-950">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-surface-card shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:max-h-[min(840px,90vh)] md:min-h-[640px] md:flex-row">
        <div className="relative h-52 w-full shrink-0 overflow-hidden md:h-auto md:w-1/2">
          {imageSrc ? (
            // Universal cover: jpg/png/webp/gif/svg/avif all work.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <HeroFallbackArt />
          )}
        </div>
        <div className="flex w-full flex-col justify-center overflow-y-auto px-7 py-9 sm:px-10 md:w-1/2 md:px-12 md:py-12">
          {children}
        </div>
      </div>
    </main>
  );
}
