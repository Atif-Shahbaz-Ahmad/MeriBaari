'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/use-translation';
import { Card } from '@web/components/ui';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold">{t('profile.privacy')}</h1>
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">{t('profile.privacyPolicyTitle')}</h2>
        <p className="text-sm text-ink-secondary">{t('profile.privacyPolicyBody')}</p>
      </Card>
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">{t('profile.privacyBusinessTitle')}</h2>
        <p className="text-sm text-ink-secondary">{t('profile.privacyBusinessBody')}</p>
      </Card>
      <Link className="text-sm font-semibold text-primary" href="/">
        MeriBaari
      </Link>
    </main>
  );
}
