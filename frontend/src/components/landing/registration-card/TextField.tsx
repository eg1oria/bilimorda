import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

type TextFieldProps = {
  label: string;
  icon: LucideIcon;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

export default function TextField({ label, icon: Icon, ...inputProps }: TextFieldProps) {
  return (
    <label className="mb-[18px] block">
      <span className="mb-2 block text-xs font-[750] text-[#2d3546]">{label}</span>
      <span className="flex h-[52px] items-center gap-[11px] rounded-[6px] border border-[#dcdedb] bg-[#fafaf8] px-[15px] text-[#9ca1aa] transition-[border-color,box-shadow,background] duration-150 focus-within:border-[#172033] focus-within:bg-white focus-within:text-[#172033] focus-within:shadow-[0_0_0_3px_rgba(23,32,51,0.08)] motion-reduce:transition-none">
        <Icon size={18} aria-hidden="true" />
        <input
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-[550] text-[#172033] outline-0 placeholder:font-[450] placeholder:text-[#a1a6ae]"
          {...inputProps}
        />
      </span>
    </label>
  );
}
