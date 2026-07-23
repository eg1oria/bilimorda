'use client';

import {
  CheckCircle2,
  CircleOff,
  Edit3,
  FileQuestion,
  LoaderCircle,
  Plus,
  Rocket,
  Save,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { MODULE_LABELS, SCORING_OPTIONS } from '@/data/questionnaire';
import type { AdminQuestion, AdminQuestionsResponse } from '@/lib/admin-types';
import type { QuestionModule } from '@/lib/questionnaire-types';
import AdminNav from './AdminNav';

type QuestionForm = {
  textRu: string;
  textKk: string;
  module: QuestionModule;
  sortOrder: number;
  scoreTarget: string;
  reverseScored: boolean;
  included: boolean;
};

const emptyForm: QuestionForm = {
  textRu: '',
  textKk: '',
  module: 'TEAM_ROLES',
  sortOrder: 1,
  scoreTarget: SCORING_OPTIONS.TEAM_ROLES[0].value,
  reverseScored: false,
  included: true,
};

const fieldClass =
  'w-full rounded-[13px] border border-[#dfe1dd] bg-[#f9f9f6] px-3.5 py-3 text-sm font-medium text-[#172033] outline-none transition focus:border-[#172033] focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,32,51,0.07)]';

export default function QuestionsDashboard({
  initialData,
  routeToken,
}: {
  initialData: AdminQuestionsResponse;
  routeToken: string;
}) {
  const [data, setData] = useState(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [moduleFilter, setModuleFilter] = useState<QuestionModule | 'ALL'>('ALL');
  const [busy, setBusy] = useState<'save' | 'publish' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleQuestions = useMemo(
    () =>
      data.items.filter(
        (question) => moduleFilter === 'ALL' || question.module === moduleFilter,
      ),
    [data.items, moduleFilter],
  );

  async function refresh() {
    const response = await fetch('/api/admin/questions', {
      headers: { 'x-admin-route-token': routeToken },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Не удалось обновить список вопросов.');
    const refreshed = (await response.json()) as AdminQuestionsResponse;
    setData(refreshed);
    return refreshed;
  }

  function changeModule(module: QuestionModule) {
    setForm((current) => ({
      ...current,
      module,
      scoreTarget: SCORING_OPTIONS[module][0].value,
      reverseScored: module === 'MBTI' ? false : current.reverseScored,
    }));
  }

  function editQuestion(question: AdminQuestion) {
    setEditingId(question.id);
    setForm({
      textRu: question.textRu,
      textKk: question.textKk ?? '',
      module: question.module,
      sortOrder: question.sortOrder,
      scoreTarget: question.scoreTarget,
      reverseScored: question.reverseScored,
      included: question.included,
    });
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm(total = data.total) {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: total + 1 });
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('save');
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        editingId ? `/api/admin/questions/${editingId}` : '/api/admin/questions',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-route-token': routeToken,
          },
          body: JSON.stringify({ ...form, textKk: form.textKk || null }),
        },
      );
      if (!response.ok) throw new Error('Проверьте заполнение всех полей.');
      const refreshed = await refresh();
      setMessage(editingId ? 'Вопрос обновлён.' : 'Вопрос добавлен в черновик.');
      resetForm(refreshed.total);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось сохранить вопрос.');
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    setBusy('publish');
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/questions/publish', {
        method: 'POST',
        headers: { 'x-admin-route-token': routeToken },
      });
      if (!response.ok) throw new Error('Не удалось опубликовать набор вопросов.');
      const published = (await response.json()) as { number: number };
      await refresh();
      setMessage(`Версия ${published.number} опубликована для новых попыток.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ошибка публикации.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f4ef] px-4 py-5 [background-image:linear-gradient(rgba(23,32,51,0.026)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,51,0.026)_1px,transparent_1px)] [background-size:38px_38px] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="m-0 text-[11px] font-extrabold tracking-[0.08em] text-[#777e89] uppercase">Bilim Orda · управление тестом</p>
            <h1 className="mt-1 mb-0 text-[28px] font-[800] tracking-[-0.045em] text-[#172033]">Вопросы</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AdminNav token={routeToken} active="questions" />
            <button
              className="flex h-11 cursor-pointer items-center gap-2 rounded-[13px] border-0 bg-[#172033] px-4 text-xs font-bold text-white shadow-[0_4px_0_#9ce6d5] disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              onClick={publish}
              disabled={!data.canPublish || busy !== null}>
              {busy === 'publish' ? <LoaderCircle className="animate-spin" size={16} /> : <Rocket size={16} />}
              Опубликовать
            </button>
          </div>
        </header>

        <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Готовность теста">
          {(['TEAM_ROLES', 'MBTI', 'RIASEC'] as QuestionModule[]).map((module) => {
            const coverage = data.coverage[module];
            const complete = coverage.covered === coverage.total;
            return (
              <article className="rounded-[20px] border border-[rgba(23,32,51,0.09)] bg-white p-4 shadow-sm" key={module}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#4e5663]">{MODULE_LABELS[module]}</span>
                  {complete ? <CheckCircle2 size={18} className="text-[#2f8e76]" /> : <CircleOff size={18} className="text-[#c47843]" />}
                </div>
                <p className="m-0 text-2xl font-[800] text-[#172033]">{coverage.covered}/{coverage.total}</p>
                <p className="mt-1 mb-0 truncate text-[10px] font-semibold text-[#8b9098]">{complete ? 'Все шкалы заполнены' : `Нет: ${coverage.missing.join(', ')}`}</p>
              </article>
            );
          })}
          <article className="rounded-[20px] border border-[rgba(23,32,51,0.09)] bg-[#172033] p-4 text-white shadow-sm">
            <span className="text-xs font-bold text-[#bfc8d8]">Публикация</span>
            <p className="mt-2 mb-0 text-xl font-[800]">{data.currentVersion ? `Версия ${data.currentVersion.number}` : 'Ещё нет'}</p>
            <p className="mt-1 mb-0 text-[10px] text-[#bfc8d8]">{data.currentVersion ? `${data.currentVersion.questionCount} вопросов` : 'Сначала заполните шкалы'}</p>
          </article>
        </section>

        {message ? <p className="mb-4 rounded-xl bg-[#e5f8f3] px-4 py-3 text-xs font-bold text-[#226553]" role="status">{message}</p> : null}
        {error ? <p className="mb-4 rounded-xl bg-[#fff0ec] px-4 py-3 text-xs font-bold text-[#a64739]" role="alert">{error}</p> : null}
        {!data.canPublish && data.publishBlockedReason ? <p className="mb-4 rounded-xl border border-[#ead9c7] bg-[#fff9f0] px-4 py-3 text-xs font-semibold text-[#8b623c]">Публикация недоступна: {data.publishBlockedReason}</p> : null}

        <div className="grid items-start gap-4 lg:grid-cols-[410px_1fr]">
          <section className="rounded-[24px] border border-[rgba(23,32,51,0.1)] bg-white p-5 shadow-[0_18px_50px_rgba(32,41,59,0.07)] lg:sticky lg:top-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="m-0 text-[10px] font-extrabold tracking-[0.08em] text-[#8a9099] uppercase">{editingId ? 'Редактирование' : 'Новый вопрос'}</p>
                <h2 className="mt-1 mb-0 text-lg font-[800] text-[#172033]">{editingId ? 'Изменить вопрос' : 'Добавить вопрос'}</h2>
              </div>
              {editingId ? <button type="button" className="cursor-pointer rounded-lg border-0 bg-[#f1f2ee] px-3 py-2 text-[11px] font-bold text-[#5f6670]" onClick={() => resetForm()}>Новый</button> : <Plus size={20} />}
            </div>

            <form className="grid gap-4" onSubmit={submit}>
              <label className="grid gap-1.5 text-xs font-bold text-[#535b67]">Вопрос на русском
                <textarea className={`${fieldClass} min-h-24 resize-y`} value={form.textRu} minLength={5} maxLength={500} required onChange={(event) => setForm({ ...form, textRu: event.target.value })} />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-[#535b67]">Вопрос на казахском <span className="font-medium text-[#969ba3]">(необязательно)</span>
                <textarea className={`${fieldClass} min-h-20 resize-y`} value={form.textKk} minLength={5} maxLength={500} onChange={(event) => setForm({ ...form, textKk: event.target.value })} />
              </label>
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <label className="grid gap-1.5 text-xs font-bold text-[#535b67]">Блок
                  <select className={fieldClass} value={form.module} onChange={(event) => changeModule(event.target.value as QuestionModule)}>
                    {Object.entries(MODULE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-xs font-bold text-[#535b67]">Порядок
                  <input className={fieldClass} type="number" min={0} max={10000} value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} required />
                </label>
              </div>
              <label className="grid gap-1.5 text-xs font-bold text-[#535b67]">{form.module === 'MBTI' ? 'Ответ «5» поддерживает' : 'Категория результата'}
                <select className={fieldClass} value={form.scoreTarget} onChange={(event) => setForm({ ...form, scoreTarget: event.target.value })}>
                  {SCORING_OPTIONS[form.module].map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
              </label>
              {form.module !== 'MBTI' ? <label className="flex cursor-pointer items-center gap-3 rounded-[13px] bg-[#f7f7f3] p-3 text-xs font-bold text-[#535b67]">
                <input className="size-4 accent-[#172033]" type="checkbox" checked={form.reverseScored} onChange={(event) => setForm({ ...form, reverseScored: event.target.checked })} />
                Обратный подсчёт: 5 превращается в 1
              </label> : null}
              <label className="flex cursor-pointer items-center gap-3 rounded-[13px] bg-[#f7f7f3] p-3 text-xs font-bold text-[#535b67]">
                <input className="size-4 accent-[#172033]" type="checkbox" checked={form.included} onChange={(event) => setForm({ ...form, included: event.target.checked })} />
                Включить в следующую публикацию
              </label>
              <button className="mt-1 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[13px] border-0 bg-[#172033] text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy !== null}>
                {busy === 'save' ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
                {editingId ? 'Сохранить изменения' : 'Добавить вопрос'}
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-[rgba(23,32,51,0.1)] bg-white shadow-[0_18px_50px_rgba(32,41,59,0.07)]">
            <div className="flex flex-col gap-3 border-b border-[#e8e9e5] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="m-0 text-base font-[800] text-[#172033]">Черновик · {data.total}</h2>
                <p className="mt-1 mb-0 text-[11px] text-[#858b94]">В публикацию войдёт {data.included}</p>
              </div>
              <select className="h-10 rounded-xl border border-[#dfe1dd] bg-[#f8f8f5] px-3 text-xs font-bold text-[#535b67]" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value as QuestionModule | 'ALL')}>
                <option value="ALL">Все блоки</option>
                {Object.entries(MODULE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </div>
            {visibleQuestions.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#eff0ec] text-[#858c94]"><FileQuestion size={24} /></span>
              <h3 className="m-0 text-base font-bold text-[#172033]">Вопросов пока нет</h3>
              <p className="mt-2 mb-0 max-w-xs text-xs leading-5 text-[#858b94]">Добавьте первый оригинальный или лицензированный вопрос через форму.</p>
            </div> : <div className="divide-y divide-[#ecece8]">
              {visibleQuestions.map((question) => (
                <article className={`p-4 transition-colors hover:bg-[#fbfbf8] ${question.included ? '' : 'opacity-55'}`} key={question.id}>
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#edf0ff] text-xs font-extrabold text-[#4d3ca2]">{question.sortOrder}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#e5f8f3] px-2.5 py-1 text-[9px] font-extrabold text-[#225f53]">{MODULE_LABELS[question.module]}</span>
                        <span className="rounded-full bg-[#f0edf8] px-2.5 py-1 text-[9px] font-extrabold text-[#5e4b79]">{question.scoreTarget}{question.reverseScored ? ' · обратный' : ''}</span>
                        {!question.included ? <span className="text-[9px] font-bold text-[#a24f43]">не публикуется</span> : null}
                      </div>
                      <p className="m-0 text-sm leading-6 font-semibold text-[#303949]">{question.textRu}</p>
                      {question.textKk ? <p className="mt-1 mb-0 text-xs leading-5 text-[#858b94]">KZ: {question.textKk}</p> : null}
                    </div>
                    <button className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#dfe1dd] bg-white text-[#59616d] hover:border-[#172033] hover:text-[#172033]" type="button" aria-label="Редактировать вопрос" onClick={() => editQuestion(question)}><Edit3 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>}
          </section>
        </div>
      </div>
    </main>
  );
}
