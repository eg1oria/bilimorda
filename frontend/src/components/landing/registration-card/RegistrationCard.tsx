import { Check } from 'lucide-react';
import type { Dictionary } from '@/i18n/dictionaries';
import RegistrationForm from './RegistrationForm';

export default function RegistrationCard({
  content,
}: {
  content: Dictionary['registration'];
}) {
  return (
    <aside
      className="sticky top-7 col-start-2 row-start-1 row-span-3 max-[790px]:static max-[790px]:col-start-1 max-[790px]:row-start-2 max-[790px]:row-span-1 max-[790px]:mt-[38px] max-[790px]:w-full"
      aria-label={content.ariaLabel}>
      <div className="relative overflow-hidden rounded-[10px] border border-[rgba(23,32,51,0.11)] bg-white p-9 shadow-[0_28px_70px_rgba(32,41,59,0.12),0_3px_0_rgba(23,32,51,0.04)] max-[980px]:p-[30px] max-[520px]:rounded-[23px] max-[520px]:px-5 max-[520px]:py-[28px] max-[520px]:pb-[25px]">
        <div
          className="absolute top-0 right-0 flex size-[74px] items-center justify-center rounded-bl-[74px] border-b-[2px] border-l-[2px] border-[#9ce6d5] text-[#55bda6]"
          aria-hidden="true">
          <Check className="translate-x-2 -translate-y-2" size={22} strokeWidth={2} />
        </div>

        <div className="pr-[34px] max-[520px]:pr-[26px] ">
          <span className="mb-[10px] hidden text-[11px] font-[750] tracking-[0.07em] text-[#777e89] uppercase max-[790px]:block">
            {content.step}
          </span>
          <h2 className="mt-0 mb-2 text-[28px] leading-[1.2] font-[780] tracking-[-0.04em] text-[#172033] max-[520px]:text-[25px]">
            {content.title}
          </h2>
          <p className="m-0 text-[13px] leading-[1.55] text-[#767d88]">
            {content.description}
          </p>
        </div>
        <RegistrationForm content={content.form} />
      </div>
    </aside>
  );
}
