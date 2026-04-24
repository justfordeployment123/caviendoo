import { getRequestConfig } from 'next-intl/server';

/**
 * Server-side locale resolution for next-intl v4.
 *
 * M1: No URL-based locale routing — always returns 'en' for SSR.
 * The client IntlProvider (Zustand-driven) overrides the locale post-hydration,
 * so EN messages served by SSR are replaced immediately on mount.
 *
 * M2: Replace with requestLocale detection from the [locale] route segment.
 */
export default getRequestConfig(async () => {
  const locale = 'en';
  return {
    locale,
    messages: (await import('../messages/en.json')).default,
  };
});
