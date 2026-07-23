import type { Dictionary } from '@/i18n/dictionaries';

export type Grade = '10' | '11';

type GradeSelectorProps = {
  content: Dictionary['registration']['form'];
  value: Grade;
  onChange: (grade: Grade) => void;
};

export default function GradeSelector({ content, value, onChange }: GradeSelectorProps) {
  return (
    <fieldset className="m-0 mb-[18px] min-w-0 border-0 p-0">
      <legend className="mb-2 block text-xs font-[750] text-[#2d3546]">{content.gradeLabel}</legend>
      <select
        className="h-12 w-full touch-manipulation rounded-[13px] border border-[#dcdfdb] bg-[#fafaf8] px-4 text-base font-bold text-[#172033] outline-none focus:border-[#172033] focus:ring-3 focus:ring-[rgba(23,32,51,0.1)] sm:hidden"
        name="grade"
        value={value}
        onChange={(event) => onChange(event.target.value as Grade)}
        aria-label={content.gradeLabel}>
        <option value="10">{content.grade10}</option>
        <option value="11">{content.grade11}</option>
      </select>
      <div className="hidden grid-cols-2 gap-[10px] sm:grid">
        {(['10', '11'] as const).map((grade) => (
          <button
            className={`flex h-[40px] touch-manipulation cursor-pointer items-center justify-center gap-2 rounded-[13px] border text-[13px] font-bold transition-[border-color,background,color,transform] duration-150 hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(23,32,51,0.14)] motion-reduce:transition-none ${
              value === grade
                ? 'border-[#172033] bg-[#172033] text-white'
                : 'border-[#dcdfdb] bg-[#fafaf8] text-[#656c78] hover:border-[#a8aca6]'
            }`}
            type="button"
            aria-pressed={value === grade}
            onClick={() => onChange(grade)}
            key={grade}>
            <span>{grade === '10' ? content.grade10 : content.grade11}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
