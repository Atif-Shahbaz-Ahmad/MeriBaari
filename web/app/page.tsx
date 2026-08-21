import Link from 'next/link';

import { Logo } from '@web/components/Logo';
import { listPublicOrganizations } from '@web/lib/public-organizations';

export default async function MarketingPage() {
  let orgs: Awaited<ReturnType<typeof listPublicOrganizations>> = [];
  try {
<<<<<<< Updated upstream
    orgs = (await listPublicOrganizations()).slice(0, 6);
=======
    orgs = (await listPublicOrganizations()).slice(0, 3);
>>>>>>> Stashed changes
  } catch {
    orgs = [];
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Logo />
<<<<<<< Updated upstream
      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Skip the wait. Take your turn.
          </h1>
          <p className="mt-4 text-lg text-ink-secondary">
            Discover businesses, join live queues, and track your ticket — or run
            your queue from a desktop workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-white"
              href="/signup"
            >
              I&apos;m a customer
            </Link>
            <Link
              className="rounded-xl border border-line px-5 py-3 font-semibold"
              href="/signup"
            >
              I&apos;m a business owner
            </Link>
            <Link className="px-5 py-3 font-semibold text-primary" href="/login">
              Sign in
            </Link>
            <Link className="px-5 py-3 font-semibold text-primary" href="/download">
              Download apps
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface-card p-6 shadow-card">
          <h2 className="font-semibold">Live businesses</h2>
          {orgs.length === 0 ? (
            <p className="mt-3 text-sm text-ink-secondary">
              Approved businesses appear here from MeriBaari.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {orgs.map((org) => (
                <li key={org.id}>
                  <Link className="hover:text-primary" href={`/businesses/${org.id}`}>
                    {org.name} · {org.city}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            className="mt-4 inline-block text-sm font-semibold text-primary"
            href="/businesses"
          >
            Browse businesses
          </Link>
        </div>
      </section>
    </main>
=======
      <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
        Skip the wait.
        <br />
        Take your turn.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary lg:text-base">
        Discover businesses, join live queues, and track your ticket — or run
        your queue from a desktop workspace.
      </p>
      <ul className="mt-4 space-y-1.5 text-sm text-ink-secondary">
        <li className="flex gap-2">
          <span className="text-secondary">✓</span>
          Live ticket updates without standing in line
        </li>
        <li className="flex gap-2">
          <span className="text-secondary">✓</span>
          One workspace for customers and business owners
        </li>
        <li className="flex gap-2">
          <span className="text-secondary">✓</span>
          Works on web, Android, and desktop
        </li>
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          className="rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-600"
          href="/signup"
        >
          I&apos;m a customer
        </Link>
        <Link
          className="rounded-xl border border-line px-5 py-2.5 text-center text-sm font-semibold hover:bg-surface-card"
          href="/signup"
        >
          I&apos;m a business owner
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-primary">
        <Link href="/login">Sign in</Link>
        <Link href="/download">Download apps</Link>
        <Link href="/businesses">Browse businesses</Link>
      </div>
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Live businesses
        </p>
        {orgs.length === 0 ? (
          <p className="mt-1.5 text-sm text-ink-secondary">
            Approved businesses appear here from MeriBaari.
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1">
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
>>>>>>> Stashed changes
  );
}
