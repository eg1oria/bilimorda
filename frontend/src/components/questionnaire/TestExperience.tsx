'use client';

import { ArrowLeft, Check, LoaderCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type {
  AttemptSession,
  LikertValue,
  PublicQuestion,
  QuestionnaireResult,
} from '@/lib/questionnaire-types';
import { exceedsNeutralAnswerLimit } from '@/lib/questionnaire-progress';
import {
  clearQuestionnaireStorage,
  readAttemptToken,
  saveQuestionnaireResult,
} from '@/lib/questionnaire-storage';

const values: LikertValue[] = [1, 2, 3, 4, 5];
const answerTones = [
  {
    card: 'border-[#efaaa5] bg-[#fff0ee] hover:border-[#df7e77] hover:bg-[#ffe3e0]',
    selectedCard: 'border-[#d96e67] bg-[#ffc8c3] text-[#682c28]',
    circle: 'border-[#df8b85] bg-white',
    selectedCircle: 'border-[#d26059] bg-[#ed7f78] text-white',
  },
  {
    card: 'border-[#f0c2b5] bg-[#fff5f1] hover:border-[#e4a18f] hover:bg-[#ffe9e2]',
    selectedCard: 'border-[#db927e] bg-[#ffd8cc] text-[#714034]',
    circle: 'border-[#e2a795] bg-white',
    selectedCircle: 'border-[#d58b76] bg-[#efad9a] text-[#643a30]',
  },
  {
    card: 'border-[#d4d7d1] bg-[#f5f6f3] hover:border-[#afb4ac] hover:bg-[#e9ebe7]',
    selectedCard: 'border-[#9fa59c] bg-[#d9ddd7] text-[#3f453f]',
    circle: 'border-[#afb4ac] bg-white',
    selectedCircle: 'border-[#979d94] bg-[#bcc1ba] text-[#343934]',
  },
  {
    card: 'border-[#b7e4d8] bg-[#f0faf7] hover:border-[#89ceb9] hover:bg-[#e0f6ef]',
    selectedCard: 'border-[#75c5ad] bg-[#ccefe5] text-[#245044]',
    circle: 'border-[#91cfbd] bg-white',
    selectedCircle: 'border-[#69bda5] bg-[#9edcc9] text-[#21483d]',
  },
  {
    card: 'border-[#8fdac8] bg-[#e8faf5] hover:border-[#5fc6ae] hover:bg-[#d3f5ec]',
    selectedCard: 'border-[#4ebca3] bg-[#9ce6d5] text-[#173d35]',
    circle: 'border-[#65c8b1] bg-white',
    selectedCircle: 'border-[#3daa92] bg-[#55bda6] text-white',
  },
] as const;

export default function TestExperience({
  locale,
  content,
}: {
  locale: Locale;
  content: Dictionary['test'];
}) {
  const router = useRouter();
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [neutralWarningOpen, setNeutralWarningOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const token = readAttemptToken();
      if (!token) {
        if (!cancelled) {
          setMissing(true);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/questionnaire/attempt?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Attempt unavailable');
        const loaded = (await response.json()) as AttemptSession;
        if (cancelled) return;
        if (loaded.status === 'COMPLETED' && loaded.result) {
          saveQuestionnaireResult(loaded.result);
          router.replace(`/${locale}/result`);
          return;
        }
        if (loaded.status !== 'IN_PROGRESS') {
          setMissing(true);
          return;
        }
        setSession(loaded);
        const firstUnanswered = loaded.questions.findIndex((question) => question.answer === null);
        setCurrentIndex(firstUnanswered === -1 ? loaded.questions.length - 1 : firstUnanswered);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  const currentQuestion = session?.questions[currentIndex] ?? null;
  const progress =
    session && session.total > 0 ? Math.round((session.answeredCount / session.total) * 100) : 0;
  function updateQuestion(question: PublicQuestion, answer: LikertValue | null) {
    if (!session) return;
    const questions = session.questions.map((item) =>
      item.id === question.id ? { ...item, answer } : item,
    );
    setSession({
      ...session,
      questions,
      answeredCount: questions.filter((item) => item.answer !== null).length,
    });
  }

  async function chooseAnswer(value: LikertValue) {
    if (!currentQuestion || !session || saving) return;
    const previous = currentQuestion.answer;
    const answeredIndex = currentIndex;
    const shouldAdvance = answeredIndex < session.questions.length - 1;
    updateQuestion(currentQuestion, value);
    if (shouldAdvance) setCurrentIndex(answeredIndex + 1);
    setSaving(true);
    setSaveError(false);

    try {
      const token = readAttemptToken();
      if (!token) throw new Error('Missing token');
      const response = await fetch(`/api/questionnaire/answers/${currentQuestion.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) throw new Error('Save failed');
    } catch {
      updateQuestion(currentQuestion, previous);
      setCurrentIndex(answeredIndex);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function complete() {
    if (!session || session.answeredCount !== session.total || saving) return;
    if (exceedsNeutralAnswerLimit(session.questions)) {
      setNeutralWarningOpen(true);
      return;
    }
    setCompleting(true);
    setSaveError(false);
    try {
      const token = readAttemptToken();
      if (!token) throw new Error('Missing token');
      const response = await fetch('/api/questionnaire/complete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Complete failed');
      const completedResult = (await response.json()) as QuestionnaireResult;
      saveQuestionnaireResult(completedResult);
      router.push(`/${locale}/result`);
    } catch {
      setSaveError(true);
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <StateCard>
        <LoaderCircle className="animate-spin text-[#55bda6]" size={28} />
        <p>{content.loading}</p>
      </StateCard>
    );
  }

  if (missing || loadError || !session || !currentQuestion) {
    return (
      <StateCard>
        <RotateCcw className="text-[#55bda6]" size={29} />
        <h1>{content.noSessionTitle}</h1>
        <p>{content.noSessionText}</p>
        <Link
          className="mt-2 rounded-xl bg-[#172033] px-5 py-3 text-sm font-bold text-white"
          href={`/${locale}`}>
          {content.backRegistration}
        </Link>
      </StateCard>
    );
  }

  const isLast = currentIndex === session.questions.length - 1;
  const canComplete = session.answeredCount === session.total;

  return (
    <main className="min-h-[calc(100vh-82px)] px-4 py-7 sm:px-6 sm:py-10" id="top">
      <div className="mx-auto max-w-4xl">
        

        <div
          className="mb-5 h-2 overflow-hidden rounded-full bg-[#dedfd9]"
          aria-label={`${progress}%`}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}>
          <div
            className="h-full rounded-full bg-[#a3d6ca] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="overflow-hidden rounded-[16px] border border-[rgba(23,32,51,0.1)] bg-white shadow-[0_24px_70px_rgba(32,41,59,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8e9e5] bg-[#fafaf7] px-5 py-4 sm:px-8">
            <span className="text-[14px] font-extrabold text-[#347663]">
              {content.modules[currentQuestion.module]}
            </span>
          
          <p className="m-0 text-xs font-bold text-[#707783]">
            {session.answeredCount} / {session.total} · {content.answered}
          </p>
          
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className="m-0 text-lg leading-[1.45] font-[780] tracking-[-0.025em] text-[#172033] sm:text-2xl">
              {currentQuestion.text}
            </h2>

            <div className="mt-7 grid gap-2.5" role="radiogroup" aria-label={currentQuestion.text}>
              {values.map((value, index) => {
                const selected = currentQuestion.answer === value;
                const tone = answerTones[index];
                return (
                  <button
                    className={`group grid min-h-14 cursor-pointer grid-cols-[28px_1fr] items-center gap-3 rounded-[15px] border px-3.5 py-2.5 text-left text-xs font-bold shadow-[0_3px_0_rgba(23,32,51,0.08)] transition-[border-color,background,transform,box-shadow,filter] duration-150 active:translate-y-px active:scale-[0.997] active:brightness-[0.995] active:shadow-[0_2px_0_rgba(23,32,51,0.08)] sm:grid-cols-[32px_1fr] sm:px-4 sm:text-sm ${selected ? tone.selectedCard : `${tone.card} text-[#555d69]`}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={saving}
                    onClick={() => chooseAnswer(value)}
                    key={value}>
                    <span
                      className={`flex size-6 items-center justify-center rounded-full border-2 transition-[color,background,border-color,transform] duration-150 group-active:scale-90 ${selected ? tone.selectedCircle : tone.circle}`}>
                      {selected ? <Check size={14} strokeWidth={3} /> : null}
                    </span>
                    {content.scale[index]}
                  </button>
                );
              })}
            </div>
            {saveError ? (
              <span className="sr-only" role="alert">
                {content.saveError}
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[#e8e9e5] bg-[#fafaf7] px-3 py-4 sm:px-5">
            <button
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#d8dad5] bg-white px-4 text-xs font-bold text-[#59616d] disabled:cursor-not-allowed disabled:opacity-35"
              type="button"
              disabled={currentIndex === 0 || completing}
              onClick={() => setCurrentIndex((index) => index - 1)}>
              <ArrowLeft size={16} /> {content.previous}
            </button>
            {isLast ? (
              <button
                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#172033] px-5 text-xs font-bold text-white shadow-[0_4px_0_#9ce6d5] disabled:cursor-not-allowed disabled:opacity-35"
                type="button"
                disabled={!canComplete || saving || completing}
                onClick={complete}>
                {completing ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                {completing ? content.completing : content.complete}
              </button>
            ) : (
              // <button
              //   className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#172033] px-5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-35"
              //   type="button"
              //   disabled={!currentQuestion.answer || saving}
              //   onClick={() => setCurrentIndex((index) => index + 1)}>
              //   {content.next} <ArrowRight size={16} />
              // </button>
              null
            )}
          </div>
        </section>
      </div>
      {neutralWarningOpen ? (
        <NeutralAnswersDialog
          locale={locale}
          content={content}
          onClose={() => setNeutralWarningOpen(false)}
        />
      ) : null}
    </main>
  );
}

function NeutralAnswersDialog({
  locale,
  content,
  onClose,
}: {
  locale: Locale;
  content: Dictionary['test'];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      className="m-auto w-[min(430px,calc(100%_-_32px))] rounded-[18px] border border-[#d7cce8] bg-white p-0 text-[#172033] shadow-[0_28px_90px_rgba(23,32,51,0.24)] backdrop:bg-[rgba(23,32,51,0.5)]"
      ref={dialogRef}
      aria-labelledby="neutral-dialog-title"
      aria-describedby="neutral-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}>
      <div className="p-5 sm:p-6">
        <p className="m-0 text-[10px] font-bold tracking-[0.1em] text-[#675584] uppercase">
          {content.neutralLimitLabel}
        </p>
        <h2 className="mt-2 mb-0 text-xl leading-7 font-[820]" id="neutral-dialog-title">
          {content.neutralLimitTitle}
        </h2>
        <p
          className="mt-3 mb-0 text-sm leading-6 text-[#5f6874]"
          id="neutral-dialog-description">
          {content.neutralLimitText}
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            className="min-h-11 cursor-pointer rounded-xl border border-[#d7dad6] bg-white px-4 text-xs font-bold text-[#4e5864] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d55a0]"
            type="button"
            onClick={onClose}>
            {content.reviewNeutralAnswers}
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#172033] px-4 text-center text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d55a0]"
            href={`/${locale}`}
            onClick={clearQuestionnaireStorage}>
            {content.restartAfterNeutralLimit}
          </Link>
        </div>
      </div>
    </dialog>
  );
}

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-82px)] items-center justify-center px-4" id="top">
      <section className="flex w-full max-w-lg flex-col items-center rounded-[28px] border border-[rgba(23,32,51,0.1)] bg-white p-8 text-center text-sm font-semibold text-[#747b86] shadow-[0_24px_70px_rgba(32,41,59,0.1)] [&_h1]:mb-0 [&_h1]:text-xl [&_h1]:font-[800] [&_h1]:text-[#172033] [&_p]:max-w-sm [&_p]:leading-6">
        {children}
      </section>
    </main>
  );
}
