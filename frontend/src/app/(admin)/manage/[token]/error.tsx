'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';

export default function AdminError({
  unstable_retry,
}: {
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f4ef] px-4 [background-image:linear-gradient(rgba(23,32,51,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,51,0.026)_1px,transparent_1px)] [background-size:38px_38px]">
      <section className="w-full max-w-lg rounded-[28px] border border-[rgba(23,32,51,0.1)] bg-white p-8 text-center shadow-[0_24px_70px_rgba(32,41,59,0.12)] sm:p-10">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#b85b2b]">
          <TriangleAlert aria-hidden="true" size={25} />
        </span>
        <h1 className="m-0 text-2xl font-[780] tracking-[-0.04em] text-[#172033]">
          Не удалось загрузить данные
        </h1>
        <p className="mx-auto mt-3 mb-7 max-w-sm text-sm leading-6 text-[#777e89]">
          Проверьте, запущен ли backend, и попробуйте запросить список ещё раз.
        </p>
        <button
          className="mx-auto flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[13px] border-0 bg-[#172033] px-5 text-sm font-bold text-white transition-colors hover:bg-[#26324a] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#9ce6d5]"
          type="button"
          onClick={unstable_retry}>
          <RefreshCw size={16} aria-hidden="true" />
          Попробовать снова
        </button>
      </section>
    </main>
  );
}
