import Link from 'next/link';
import { localeConfig, locales, type Locale } from '@/i18n/config';

type LanguageSwitcherProps = {
  ariaLabel: string;
  locale: Locale;
  pathSuffix?: string;
};

export default function LanguageSwitcher({ ariaLabel, locale, pathSuffix = '' }: LanguageSwitcherProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="m-0 flex list-none items-center rounded-xl border border-[rgba(23,32,51,0.12)] bg-white/70 p-1 text-xs font-bold">
        {locales.map((availableLocale) => {
          const config = localeConfig[availableLocale];
          const isActive = locale === availableLocale;

          return (
            <li key={availableLocale}>
              <Link
                className={`block rounded-lg px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#172033] ${
                  isActive
                    ? 'bg-[#172033] text-white'
                    : 'text-[#6f7580] hover:bg-white hover:text-[#172033]'
                }`}
                href={`${config.href}${pathSuffix}`}
                hrefLang={config.htmlLang}
                lang={config.htmlLang}
                aria-current={isActive ? 'page' : undefined}>
                {config.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
