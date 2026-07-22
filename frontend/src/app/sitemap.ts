import type { MetadataRoute } from 'next';
import { languageAlternates, localeConfig, locales } from '@/i18n/config';
import { getAbsoluteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(languageAlternates).map(([language, pathname]) => [
      language,
      getAbsoluteUrl(pathname),
    ]),
  );

  return locales.map((locale) => ({
    url: getAbsoluteUrl(localeConfig[locale].href),
    changeFrequency: 'monthly',
    priority: 1,
    alternates: { languages },
  }));
}
