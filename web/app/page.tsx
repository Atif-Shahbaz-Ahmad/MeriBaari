import Link from 'next/link';

import { Logo } from '@web/components/Logo';
import { SplitHeroLayout } from '@web/components/SplitHeroLayout';
import { resolveHeroImageSrc } from '@web/lib/hero-image';
import { listPublicOrganizations } from '@web/lib/public-organizations';

export default async function MarketingPage() {
  let orgs: Awaited<ReturnType<typeof listPublicOrganizations>> = [];
  try {
    orgs = (await listPublicOrganizations()).slice(0, 5);
  } catch {
    orgs = [];
  }

  return (
    <SplitHeroLayout imageSrc={resolveHeroImageSrc()}>
      <Logo />
      <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-[2.6rem]">
        Skip the wait.
        <br />
        Take your turn.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-secondary">
        Discover businesses, join live queues, and track your ticket — or run
        your queue from a desktop workspace.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-ink-secondary">
        <li className="flex gap-2">
          <span className="mt-0.5 text-secondary">✓</span>
          Live ticket updates without standing in line
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 text-secondary">✓</span>
          One workspace for customers and business owners
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 text-secondary">✓</span>
          Works on web, Android, and desktop
        </li>
      </ul>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          className="rounded-xl bg-primary px-5 py-3 text-center font-semibold text-white hover:bg-primary-600"
          href="/signup"
        >
          I&apos;m a customer
        </Link>
        <Link
          className="rounded-xl border border-line px-5 py-3 text-center font-semibold hover:bg-surface"
          href="/signup"
        >
          I&apos;m a business owner
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-primary">
        <Link href="/login">Sign in</Link>
        <Link href="/download">Download apps</Link>
        <Link href="/businesses">Browse businesses</Link>
      </div>
      <div className="mt-8 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Live businesses
        </p>
        {orgs.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Approved businesses appear here from MeriBaari.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {orgs.map((org) => (
              <li key={org.id}>
                <Link
                  className="text-sm font-medium hover:text-primary"
                  href={`/businesses/${org.id}`}
                >
                  {org.name}
                  <span className="font-normal text-ink-muted"> · {org.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SplitHeroLayout>
  );
}
