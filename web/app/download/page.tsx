import type { Metadata } from 'next';
import Link from 'next/link';

import { DOWNLOAD_CONFIG } from '@/config/downloads';
import { Logo } from '@web/components/Logo';

export const metadata: Metadata = {
  title: 'Download — MeriBaari',
  description: 'Download the MeriBaari Android app and Windows desktop app.',
};

const apps = [DOWNLOAD_CONFIG.mobile, DOWNLOAD_CONFIG.desktop];

export default function DownloadPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Logo />
      <section className="mt-10">
        <h1 className="text-4xl font-bold leading-tight">Download MeriBaari</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-secondary">
          Get the preview app on Android or Windows. Join queues, track your
          ticket, or run your business from the desktop.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {apps.map((app) => (
          <article
            key={app.fileName}
            className="flex flex-col rounded-2xl border border-line bg-surface-card p-6 shadow-card"
          >
            <p className="text-sm font-semibold text-primary">{app.platform}</p>
            <h2 className="mt-1 text-xl font-bold">{app.title}</h2>
            <p className="mt-2 flex-1 text-sm text-ink-secondary">
              {app.description}
            </p>
            <a
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-center font-semibold text-white hover:bg-primary-600"
              href={app.url}
              download={app.fileName}
            >
              Download {app.fileLabel}
            </a>
            <p className="mt-3 text-xs text-ink-muted">{app.fileName}</p>
          </article>
        ))}
      </section>

      <p className="mt-8 text-sm text-ink-secondary">
        Android may ask you to allow installs from this source. These are
        preview builds.
      </p>

      <Link className="mt-6 inline-block text-sm font-semibold text-primary" href="/">
        Back to MeriBaari
      </Link>
    </main>
  );
}
