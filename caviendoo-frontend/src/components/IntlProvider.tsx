'use client';

/**
 * Client-side IntlProvider.
 * Reads locale from Zustand store and provides the matching message bundle
 * to next-intl's NextIntlClientProvider.
 *
 * M2 note: when [locale] routing is activated, this component is replaced by
 * the server-side getRequestConfig + layout locale param pattern.
 */

import { NextIntlClientProvider } from 'next-intl';
import { useAtlasStore } from '@/store';
import enMessages from '@/messages/en.json';
import frMessages from '@/messages/fr.json';
import arMessages from '@/messages/ar.json';

const MESSAGE_MAP = {
  en: enMessages,
  fr: frMessages,
  ar: arMessages,
} as const;

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const locale = useAtlasStore((s) => s.locale);
  return (
    <NextIntlClientProvider locale={locale} messages={MESSAGE_MAP[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
