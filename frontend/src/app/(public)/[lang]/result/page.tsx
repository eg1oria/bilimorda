import { notFound } from 'next/navigation';
import SiteHeader from '@/components/landing/site-header/SiteHeader';
import ResultExperience from '@/components/questionnaire/ResultExperience';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export const metadata = {
  robots: { index: false, follow: false, noarchive: true },
};

export default async function ResultPage({ params }: PageProps<'/[lang]/result'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = getDictionary(lang);

  return (
    <div className="min-h-screen bg-[#f4f4ef] [background-image:linear-gradient(rgba(23,32,51,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,51,0.026)_1px,transparent_1px)] [background-size:38px_38px]">
      <SiteHeader dictionary={dictionary} locale={lang} stage="testing" pathSuffix="/result" />
      <ResultExperience locale={lang} />
    </div>
  );
}
