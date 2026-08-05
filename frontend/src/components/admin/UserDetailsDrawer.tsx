'use client';

import { Clock3, LoaderCircle, X } from 'lucide-react';
import { ADMIN_STATUS_LABELS } from '@/data/questionnaire';
import type { AdminUser, AdminUserDetails } from '@/lib/admin-types';
import { QuestionnaireResultReport } from '@/components/questionnaire/ResultExperience';

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
}

export default function UserDetailsDrawer({
  user,
  details,
  loading,
  error,
  onClose,
}: {
  user: AdminUser;
  details: AdminUserDetails | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[rgba(15,22,35,0.38)] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Попытки пользователя ${user.fullName}`}>
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Закрыть" onClick={onClose} />
      <section className="relative h-full w-full max-w-5xl overflow-y-auto bg-[#f4f4ef] shadow-[-20px_0_70px_rgba(20,29,44,0.2)]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dedfd9] bg-[rgba(244,244,239,0.96)] p-5 backdrop-blur sm:p-7">
          <div>
            <p className="m-0 text-[10px] font-extrabold tracking-[0.08em] text-[#868c95] uppercase">Карточка ученика</p>
            <h2 className="mt-1 mb-0 text-xl font-[800] text-[#172033]">{user.fullName}</h2>
            <p className="mt-1 mb-0 text-xs font-semibold text-[#747b86]">{user.school} · {user.grade} класс</p>
          </div>
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-[#d6d8d3] bg-white" type="button" onClick={onClose} aria-label="Закрыть карточку"><X size={18} /></button>
        </header>

        <div className="p-4 sm:p-6">
          {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-[#6d7480]"><LoaderCircle className="animate-spin" size={20} /> Загружаем попытки…</div> : null}
          {error ? <p className="rounded-xl bg-[#fff0ec] p-4 text-sm font-bold text-[#a64739]" role="alert">{error}</p> : null}
          {details && details.attempts.length === 0 ? <div className="rounded-[22px] border border-[#dedfd9] bg-white p-8 text-center"><Clock3 className="mx-auto mb-3 text-[#969ba3]" /><h3 className="m-0 text-base font-bold">Тест ещё не начат</h3></div> : null}

          <div className="grid gap-4">
            {details?.attempts.map((attempt, index) => (
              <article className="overflow-hidden rounded-[22px] border border-[rgba(23,32,51,0.1)] bg-white shadow-sm" key={attempt.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e9e5] p-4 sm:p-5">
                  <div>
                    <p className="m-0 text-sm font-[800] text-[#172033]">Попытка {details.attempts.length - index} · версия {attempt.version}</p>
                    <p className="mt-1 mb-0 text-[10px] font-semibold text-[#858b94]">Начата {date(attempt.startedAt)} · завершена {date(attempt.completedAt)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold ${attempt.status === 'COMPLETED' ? 'bg-[#e5f8f3] text-[#226553]' : attempt.status === 'IN_PROGRESS' ? 'bg-[#fff1d6] text-[#8c641f]' : 'bg-[#eeeeea] text-[#737983]'}`}>
                    {ADMIN_STATUS_LABELS[attempt.status]}
                  </span>
                </div>

                {attempt.result ? (
                  <div className="bg-[#f4f4ef] px-3 py-6 sm:px-5 sm:py-8">
                    <QuestionnaireResultReport
                      locale="ru"
                      result={attempt.result}
                      expandDetails
                      idPrefix={`admin-attempt-${attempt.id}`}
                    />
                  </div>
                ) : (
                  <p className="m-0 bg-[#fafaf7] p-5 text-xs font-semibold text-[#7d838c]">
                    Персональный результат появится после завершения теста.
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
