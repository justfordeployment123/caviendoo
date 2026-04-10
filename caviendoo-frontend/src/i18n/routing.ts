/**
 * next-intl routing config.
 * M1: locale is managed client-side via Zustand (no URL-based routing).
 * M2: activate createMiddleware + [locale] App Router segment for SSR per locale.
 */

export const locales = ['en', 'fr', 'ar'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';
