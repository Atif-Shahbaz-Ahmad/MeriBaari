import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Drop any photo into `web/public/` as `hero.jpg` (or .png / .webp / .gif / .avif / .svg).
 * Optional override: `NEXT_PUBLIC_HERO_IMAGE=/my-file.jpg`
 */
const HERO_FILES = [
  'hero.jpg',
  'hero.jpeg',
  'hero.png',
  'hero.webp',
  'hero.gif',
  'hero.avif',
  'hero.svg',
] as const;

function publicDirs(): string[] {
  return [path.join(process.cwd(), 'public'), path.join(process.cwd(), 'web', 'public')];
}

/** Public URL for the marketing/auth hero, or null to use the built-in artwork. */
export function resolveHeroImageSrc(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_HERO_IMAGE?.trim();
  if (fromEnv) return fromEnv;

  for (const dir of publicDirs()) {
    for (const file of HERO_FILES) {
      if (existsSync(path.join(dir, file))) return `/${file}`;
    }
  }
  return null;
}
