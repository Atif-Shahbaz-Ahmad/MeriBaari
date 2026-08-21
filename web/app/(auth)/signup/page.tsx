import { SplitHeroLayout } from '@web/components/SplitHeroLayout';
import { resolveHeroImageSrc } from '@web/lib/hero-image';

import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <SplitHeroLayout imageSrc={resolveHeroImageSrc()}>
      <SignupForm />
    </SplitHeroLayout>
  );
}
