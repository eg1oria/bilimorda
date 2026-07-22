import type { Dictionary } from '@/i18n/dictionaries';

export default function HeroIntro({ content }: { content: Dictionary['hero'] }) {
  return (
    <section
      className="col-start-1 row-start-1 max-w-[650px] max-[790px]:col-start-1 max-[790px]:row-start-1"
      aria-labelledby="page-title">
      <h1
        id="page-title"
        className="mt-6 mb-[10px] max-w-[600px] text-[clamp(28px,5vw,50px)] leading-[1.02] font-[780] tracking-[-0.055em] text-[#172033] max-[980px]:text-[clamp(43px,5.5vw,58px)] max-[790px]:mt-[22px] max-[790px]:text-[clamp(42px,10vw,60px)] max-[520px]:mt-5 max-[520px]:mb-3.5 max-[520px]:text-[clamp(40px,12.5vw,54px)] max-[520px]:tracking-[-0.06em]">
        {content.title}
      </h1>

      <p className="m-0 max-w-[580px] text-[17px] leading-[1.65] text-[#636a77] max-[520px]:text-[15px]">
        {content.description}
      </p>
    </section>
  );
}
