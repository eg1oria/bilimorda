import { Clock3 } from 'lucide-react';
import { TEST_MODULES } from '@/data/testModules';
import type { Dictionary } from '@/i18n/dictionaries';
import TestItem from './TestItem';

export default function TestOverview({ content }: { content: Dictionary['overview'] }) {
  return (
    <section
      className="col-start-1 row-start-2 mt-8 w-full max-w-[650px] max-[790px]:row-start-3 max-[790px]:mt-[42px]"
      aria-labelledby="test-overview-title">
      <div className="mb-1.5 flex items-center justify-between max-[520px]:items-end">
        <h2
          className="m-0 text-base font-extrabold tracking-[-0.02em] text-[#172033]"
          id="test-overview-title">
          {content.title}
        </h2>
        <div className="flex items-center gap-[7px] text-xs font-[650] text-[#7b818c]">
          <Clock3 size={16} aria-hidden="true" />
          {content.duration}
        </div>
      </div>

      <div className="border-t border-[rgba(23,32,51,0.13)]">
        {TEST_MODULES.map((test) => (
          <TestItem
            test={test}
            title={content.modules[test.key].title}
            description={content.modules[test.key].description}
            key={test.key}
          />
        ))}
      </div>
      <p className="mx-auto mt-[30px] max-w-[330px] text-center text-[12px] leading-normal text-[#969ba3]">
        {content.consent}
      </p>
    </section>
  );
}
