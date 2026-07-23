import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/dictionaries';
import {
  isLocale,
  languageAlternates,
  localeConfig,
  locales,
} from '@/i18n/config';
import { manrope } from '@/lib/font';
import { getSiteUrl } from '@/lib/site-url';
import '../../globals.css';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;

  if (!isLocale(lang)) return {};

  const dictionary = getDictionary(lang);
  const currentLocale = localeConfig[lang];
  const alternateLocales = locales
    .filter((locale) => locale !== lang)
    .map((locale) => localeConfig[locale].ogLocale);

  return {
    metadataBase: getSiteUrl(),
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    applicationName: 'Bilim Orda',
    alternates: {
      canonical: currentLocale.href,
      languages: languageAlternates,
    },
    openGraph: {
      type: 'website',
      siteName: 'Bilim Orda',
      title: dictionary.metadata.title,
      description: dictionary.metadata.description,
      url: currentLocale.href,
      locale: currentLocale.ogLocale,
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: 'summary',
      title: dictionary.metadata.title,
      description: dictionary.metadata.description,
    },
  };
}

export default async function LocalizedLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  return (
    <html
      lang={localeConfig[lang].htmlLang}
      className={`${manrope.variable} scroll-smooth`}
      suppressHydrationWarning>
      <body className="m-0 min-w-80 bg-[#f4f4ef] text-[#172033] [font-family:var(--font-manrope),Arial,sans-serif]">
        {children}
      </body>
    </html>
  );
}
