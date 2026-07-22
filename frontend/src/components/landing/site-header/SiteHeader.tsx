import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import Brand from "./Brand";
import LanguageSwitcher from './LanguageSwitcher';
import ProgressSteps from "./ProgressSteps";

type SiteHeaderProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export default function SiteHeader({ dictionary, locale }: SiteHeaderProps) {
  return (
    <header className="border-b border-[rgba(23,32,51,0.1)] bg-[rgba(244,244,239,0.92)]">
      <div className="mx-auto flex h-[82px] w-[min(1180px,calc(100%_-_48px))] items-center justify-between max-[790px]:h-[70px] max-[790px]:w-[min(610px,calc(100%_-_32px))] max-[520px]:w-[calc(100%_-_28px)]">
        <Brand homeLabel={dictionary.brand.homeLabel} />
        <div className="flex items-center gap-6 max-[980px]:gap-4">
          <ProgressSteps content={dictionary.progress} />
          <LanguageSwitcher ariaLabel={dictionary.languageSwitcher.ariaLabel} locale={locale} />
        </div>
      </div>
    </header>
  );
}
