import { getLocale, getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = await getLocale();
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});