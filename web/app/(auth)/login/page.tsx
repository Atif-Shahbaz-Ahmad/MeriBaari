import { Suspense } from 'react';

import { SplitHeroLayout } from '@web/components/SplitHeroLayout';
import { resolveHeroImageSrc } from '@web/lib/hero-image';

import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <SplitHeroLayout imageSrc={resolveHeroImageSrc()}>
      <Suspense fallback={<p className="text-ink-secondary">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </SplitHeroLayout>
  );
}
