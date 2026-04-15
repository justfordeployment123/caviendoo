import type { Metadata } from 'next';
import {
  Cormorant_Garamond,
  Inter,
  DM_Sans,
  Noto_Sans_Arabic,
  JetBrains_Mono,
} from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { IntlProvider } from '@/components/IntlProvider';
import enMessages from '@/messages/en.json';
import './globals.css';

// ── Fonts ─────────────────────────────────────────────────────────────────

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-arabic',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// ── Metadata ──────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Caviendoo — Agricultural Intelligence Platform',
  description:
    'Geospatial fruit intelligence for Tunisia. Explore 73 crops across 24 regions with environmental and nutritional data.',
  icons: {
    icon: '/caviendoo_logo_small.png',
  },
};

// ── Root Layout ───────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * lang and dir are set imperatively on the client by LanguageSwitcher
     * whenever the locale changes. The default is LTR English.
     */
    <html
      lang="en"
      dir="ltr"
      className={`h-full ${cormorant.variable} ${inter.variable} ${dmSans.variable} ${notoSansArabic.variable} ${jetbrainsMono.variable}`}
    >
      <body className="h-full" suppressHydrationWarning>
        {/*
         * Outer provider: static EN messages for SSR pre-render (avoids ENVIRONMENT_FALLBACK).
         * Inner IntlProvider (client): reads locale from Zustand and overrides post-hydration.
         */}
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <IntlProvider>{children}</IntlProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
