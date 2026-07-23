import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import Brand from "./Brand";
import LanguageSwitcher from './LanguageSwitcher';
import ProgressSteps from "./ProgressSteps";

type SiteHeaderProps = {
  dictionary: Dictionary;
  locale: Locale;
  stage?: 'registration' | 'testing';
  pathSuffix?: string;
};

export default function SiteHeader({ dictionary, locale, stage = 'registration', pathSuffix = '' }: SiteHeaderProps) {
  return (
    <header className="border-b border-[rgba(23,32,51,0.1)] bg-[rgba(244,244,239,0.92)]">
      <div className="mx-auto flex h-[82px] w-[min(1180px,calc(100%_-_48px))] items-center justify-between max-[790px]:h-[70px] max-[790px]:w-[min(610px,calc(100%_-_32px))] max-[520px]:w-[calc(100%_-_28px)]">
        <Brand homeLabel={dictionary.brand.homeLabel} href={`/${locale}`} />
        <div className="flex items-center gap-6 max-[980px]:gap-4">
          <ProgressSteps content={dictionary.progress} stage={stage} />
          <LanguageSwitcher ariaLabel={dictionary.languageSwitcher.ariaLabel} locale={locale} pathSuffix={pathSuffix} />
        </div>
      </div>
    </header>
  );
}
