'use client';

import {
  ArrowRight,
  Building2,
  Check,
  LoaderCircle,
  Phone,
  UserRound,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import type { Dictionary } from '@/i18n/dictionaries';
import { formatPhone } from '@/lib/formatPhone';
import GradeSelector, { type Grade } from './GradeSelector';
import TextField from './TextField';

export default function RegistrationForm({
  content,
}: {
  content: Dictionary['registration']['form'];
}) {
  const [grade, setGrade] = useState<Grade>('10');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function normalizeText(value: FormDataEntryValue | null) {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const profile = {
      fullName: normalizeText(formData.get('fullName')),
      school: normalizeText(formData.get('school')),
      grade,
      phone,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const result = (await response.json()) as { userId?: unknown };

      if (!response.ok || typeof result.userId !== 'string' || !result.userId) {
        throw new Error('Registration request failed');
      }

      try {
        sessionStorage.setItem(
          'studentProfile',
          JSON.stringify({ ...profile, userId: result.userId }),
        );
      } catch {
        // A browser may block storage; the server-side registration still succeeded.
      }
      setSubmitted(true);
    } catch {
      setError(content.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetSuccess() {
    if (submitted) setSubmitted(false);
    if (error) setError(null);
  }

  return (
    <form
      className="mt-7 max-[520px]:mt-6"
      onSubmit={handleSubmit}
      onChange={resetSuccess}
      aria-busy={isSubmitting}>
      <TextField
        label={content.fullNameLabel}
        icon={UserRound}
        name="fullName"
        type="text"
        placeholder={content.fullNamePlaceholder}
        autoComplete="name"
        minLength={5}
        maxLength={120}
        required
      />

      <TextField
        label={content.schoolLabel}
        icon={Building2}
        name="school"
        type="text"
        placeholder={content.schoolPlaceholder}
        autoComplete="organization"
        maxLength={160}
        required
      />

      <GradeSelector content={content} value={grade} onChange={setGrade} />

      <TextField
        label={content.phoneLabel}
        icon={Phone}
        name="phone"
        type="tel"
        placeholder={content.phonePlaceholder}
        autoComplete="tel"
        inputMode="tel"
        value={phone}
        onChange={(event) => setPhone(formatPhone(event.target.value))}
        pattern="\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}"
        minLength={18}
        maxLength={18}
        required
      />

      <button
        className="mt-[5px] flex h-14 w-full cursor-pointer items-center justify-between rounded-[14px] border-0 bg-[#172033] pr-[19px] pl-[22px] text-sm font-[750] text-white shadow-[0_7px_0_#9ce6d5] transition-[transform,box-shadow,background] duration-150 hover:-translate-y-0.5 hover:bg-[#26324a] hover:shadow-[0_9px_0_#9ce6d5] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(124,92,252,0.32)] active:translate-y-1 active:shadow-[0_3px_0_#9ce6d5] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-[#172033] disabled:hover:shadow-[0_7px_0_#9ce6d5] motion-reduce:transition-none"
        type="submit"
        disabled={isSubmitting}>
        <span>
          {isSubmitting
            ? content.submitting
            : submitted
              ? content.submitted
              : content.submit}
        </span>
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" size={20} aria-hidden="true" />
        ) : submitted ? (
          <Check size={20} aria-hidden="true" />
        ) : (
          <ArrowRight size={20} aria-hidden="true" />
        )}
      </button>

      <div
        className={`m-0 max-h-0 overflow-hidden text-[11px] leading-normal font-semibold text-[#516024] opacity-0 transition-[max-height,margin,opacity] duration-150 motion-reduce:transition-none ${
          submitted ? 'mt-[15px] max-h-[46px] opacity-100' : ''
        }`}
        role="status"
        aria-live="polite">
        {content.success}
      </div>

      {error ? (
        <p className="mt-[15px] mb-0 text-[11px] leading-[1.45] font-semibold text-[#b34242]" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
