import { notFound } from 'next/navigation';
import { HeroIntro, RegistrationCard, SiteHeader, TestOverview } from '@/components/landing';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const dictionary = getDictionary(lang);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f4ef] [background-image:linear-gradient(rgba(23,32,51,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,51,0.026)_1px,transparent_1px)] [background-size:38px_38px] max-[520px]:[background-size:30px_30px]">
      <SiteHeader dictionary={dictionary} locale={lang} />

      <div
        className="relative mx-auto grid min-h-[calc(100vh-153px)] w-[min(1180px,calc(100%_-_48px))] grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)] items-start gap-x-[88px] py-[40px] pb-16 max-[980px]:grid-cols-[1fr_minmax(380px,0.92fr)] max-[980px]:gap-x-[46px] max-[790px]:w-[min(610px,calc(100%_-_32px))] max-[790px]:grid-cols-1 max-[790px]:py-[38px] max-[790px]:pb-12 max-[520px]:w-[calc(100%_-_28px)] max-[520px]:pt-[10px]"
        id="top">
        <HeroIntro content={dictionary.hero} />
        <TestOverview content={dictionary.overview} />
        <RegistrationCard content={dictionary.registration} />
      </div>
    </main>
  );
}
