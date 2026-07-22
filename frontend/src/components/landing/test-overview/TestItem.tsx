import { BrainCircuit, Compass, UsersRound } from 'lucide-react';
import type { TestModule, TestModuleIcon } from '@/data/testModules';

const icons = {
  users: UsersRound,
  brain: BrainCircuit,
  compass: Compass,
} satisfies Record<TestModuleIcon, typeof UsersRound>;

type TestItemProps = {
  test: TestModule;
  title: string;
  description: string;
};

export default function TestItem({ test, title, description }: TestItemProps) {
  const Icon = icons[test.icon];

  return (
    <article className="grid min-h-24 grid-cols-[32px_48px_1fr] items-center gap-2 border-b border-[rgba(23,32,51,0.13)] max-[520px]:min-h-[93px] max-[520px]:grid-cols-[44px_1fr] max-[520px]:gap-[13px]">
      <span className="self-start pt-[22px] text-[16px] text-[#5e706c] font-extrabold tracking-[0.08em] text-[#9a9fa8] max-[520px]:hidden">
        {test.number}
      </span>
      <span
        className={`grid size-12 place-items-center rounded-[15px] max-[520px]:size-11 max-[520px]:rounded-[14px]`}
        aria-hidden="true">
        <Icon size={23} strokeWidth={1.9} />
      </span>
      <div>
        <h3 className="mt-0 mb-[5px] text-base font-[750] tracking-[-0.015em] text-[#20293b] max-[520px]:text-[15px]">
          {title}
        </h3>
        <p className="m-0 text-[13px] leading-6 text-[#747b87] max-[520px]:text-xs">
          {description}
        </p>
      </div>
    </article>
  );
}
