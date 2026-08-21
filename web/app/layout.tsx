import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import { AppProviders } from '@web/components/Providers';

import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MeriBaari',
  description: 'Smart digital queue management — My Turn.',
};

const THEME_BOOTSTRAP = `(function(){try{var p=localStorage.getItem('meribaari_theme_preference');var dark=p==='dark'||((!p||p==='system')&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',!!dark);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
