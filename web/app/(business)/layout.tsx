'use client';

import { AppShell } from '@web/components/AppShell';

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell area="business">{children}</AppShell>;
}
