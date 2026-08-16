import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { Logo } from '@web/components/Logo';
import { useColorScheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { listPublicOrganizations } from '../lib/public-organizations';

export default function WelcomePage() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const orgs = useQuery({
    queryKey: ['desktop', 'public-orgs'],
    queryFn: () => listPublicOrganizations(),
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12">
      <Logo variant={scheme === 'dark' ? 'dark' : 'light'} />
      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight">{t('web.public.tagline')}</h1>
          <p className="mt-4 text-lg text-ink-secondary">{t('web.public.heroBody')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-primary px-5 py-3 font-semibold text-white"
              to="/login"
            >
              {t('web.public.signIn')}
            </Link>
            <Link
              className="rounded-xl border border-line px-5 py-3 font-semibold"
              to="/signup"
            >
              {t('web.public.businessCta')}
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface-card p-6 shadow-card">
          <h2 className="font-semibold">{t('web.public.browseBusinesses')}</h2>
          {(orgs.data ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-ink-secondary">
              Approved businesses appear here from MeriBaari.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(orgs.data ?? []).slice(0, 8).map((org) => (
                <li key={org.id}>
                  <Link className="hover:text-primary" to={`/businesses/${org.id}`}>
                    {org.name} · {org.city}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
