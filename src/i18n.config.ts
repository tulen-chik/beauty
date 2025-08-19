import { getLocale, getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'ru'] as const;
export const defaultLocale = 'ru' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const locale = await getLocale();
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});