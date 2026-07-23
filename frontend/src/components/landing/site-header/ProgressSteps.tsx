import type { Dictionary } from '@/i18n/dictionaries';

type ProgressStepsProps = {
  content: Dictionary['progress'];
  stage?: 'registration' | 'testing';
};

export default function ProgressSteps({ content, stage = 'registration' }: ProgressStepsProps) {
  const stepClass =
    "grid size-7 place-items-center rounded-full border text-xs";

  return (
    <div
      className="flex items-center text-[13px] font-[650] text-[#8a8f9b] max-[790px]:hidden"
      aria-label={content.ariaLabel}
    >
      <span className={`${stepClass} border-[#172033] bg-[#172033] text-white`}>
        1
      </span>
      <span className={`ml-[9px] ${stage === 'registration' ? 'text-[#172033]' : ''}`}>{content.registration}</span>
      <span className="mx-[13px] h-px w-[52px] bg-[#ced0cb]" aria-hidden="true" />
      <span className={`${stepClass} ${stage === 'testing' ? 'border-[#172033] bg-[#172033] text-white' : 'border-[#cfd1cd] bg-[#f4f4ef]'}`}>2</span>
      <span className={`ml-[9px] ${stage === 'testing' ? 'text-[#172033]' : ''}`}>{content.testing}</span>
    </div>
  );
}
