export const locales = ['ru', 'kk'] as const;

export type Locale = (typeof locales)[number];

type LocaleConfig = {
  htmlLang: string;
  ogLocale: string;
  label: string;
  href: `/${Locale}`;
};

export const defaultLocale: Locale = 'ru';

export const localeConfig = {
  ru: {
    htmlLang: 'ru-KZ',
    ogLocale: 'ru_KZ',
    label: 'Русский',
    href: '/ru',
  },
  kk: {
    htmlLang: 'kk-KZ',
    ogLocale: 'kk_KZ',
    label: 'Қазақша',
    href: '/kk',
  },
} satisfies Record<Locale, LocaleConfig>;

export const languageAlternates = {
  'ru-KZ': localeConfig.ru.href,
  'kk-KZ': localeConfig.kk.href,
  'x-default': localeConfig[defaultLocale].href,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
