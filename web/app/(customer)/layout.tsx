'use client';

import { AppShell } from '@web/components/AppShell';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell area="customer">{children}</AppShell>;
}
