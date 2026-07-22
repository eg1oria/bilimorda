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
      <div className="grid grid-cols-2 gap-[10px]">
        {(['10', '11'] as const).map((grade) => (
          <label
            className={`flex h-[40px] cursor-pointer items-center justify-center gap-2 rounded-[13px] border text-[13px] font-bold transition-[border-color,background,color,transform] duration-150 hover:-translate-y-px focus-within:outline-3 focus-within:outline-[rgba(23,32,51,0.1)] motion-reduce:transition-none ${
              value === grade
                ? 'border-[#172033] bg-[#172033] text-white'
                : 'border-[#dcdfdb] bg-[#fafaf8] text-[#656c78] hover:border-[#a8aca6]'
            }`}
            key={grade}>
            <input
              className="pointer-events-none absolute size-px opacity-0"
              type="radio"
              name="grade"
              value={grade}
              checked={value === grade}
              onChange={() => onChange(grade)}
            />
            <span>{grade === '10' ? content.grade10 : content.grade11}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
