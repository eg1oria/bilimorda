'use client';

import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { calculateEntRecommendations } from '@/data/entSubjectPairs';
import {
  getResultCatalog,
  isEntSubjectPairCode,
  isRiasecCode,
  isTeamRoleCode,
  riasecCodes,
  type RiasecCode,
  type TeamRoleCode,
} from '@/data/result-catalog';
import type { Locale } from '@/i18n/config';
import type { AttemptSession, QuestionnaireResult } from '@/lib/questionnaire-types';
import { getPreferenceLevel, normalizeMbti } from '@/lib/result-profile';
import {
  clearQuestionnaireStorage,
  readAttemptToken,
  readQuestionnaireResult,
  saveQuestionnaireResult,
} from '@/lib/questionnaire-storage';

export default function ResultExperience({ locale }: { locale: Locale }) {
  const catalog = getResultCatalog(locale);
  const [result, setResult] = useState<QuestionnaireResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const cachedResult = readQuestionnaireResult();
      if (cachedResult && !cancelled) {
        setResult(cachedResult);
        setLoading(false);
      }

      const token = readAttemptToken();
      if (!token) {
        if (!cancelled && !cachedResult) {
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
        if (!response.ok) throw new Error('Result unavailable');
        const session = (await response.json()) as AttemptSession;
        if (cancelled) return;
        if (session.status !== 'COMPLETED' || !session.result) {
          if (!cachedResult) setMissing(true);
          return;
        }
        saveQuestionnaireResult(session.result);
        setResult(session.result);
      } catch {
        if (!cancelled && !cachedResult) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) {
    return (
      <ResultState>
        <LoaderCircle className="animate-spin text-[#4f9f8a]" size={26} aria-hidden="true" />
        <p>{catalog.ui.loading}</p>
      </ResultState>
    );
  }

  if (missing || !result) {
    return (
      <ResultState>
        <h1>{catalog.ui.noResultTitle}</h1>
        <p>{catalog.ui.noResultText}</p>
        <Link className="result-primary-link" href={`/${locale}/test`}>
          {catalog.ui.backToTest}
        </Link>
      </ResultState>
    );
  }

  const mbti = normalizeMbti(result.mbti);
  const mbtiProfile = catalog.mbti[mbti.type];
  const roleScores = result.teamRoles.flatMap((role) =>
    isTeamRoleCode(role.code) ? [{ ...role, code: role.code }] : [],
  );
  const firstRole = roleScores[0] ?? { code: 'PLANT' as TeamRoleCode, score: 0, average: 0 };
  const secondRole = roleScores[1] ?? {
    code: 'RESOURCE_INVESTIGATOR' as TeamRoleCode,
    score: 0,
    average: 0,
  };
  const leadingRoles = [firstRole, secondRole] as const;
  const roleProfiles = leadingRoles.map((role) => catalog.teamRoles[role.code]);
  const combinedStrengths = Array.from(
    new Set(roleProfiles.flatMap((profile) => profile.strengths)),
  );
  const riskMitigations = [
    roleProfiles[0].riskMitigations[0],
    roleProfiles[1].riskMitigations[0],
    roleProfiles[0].riskMitigations[1],
  ];

  const rankedInterests = result.riasec.interests.flatMap((interest) =>
    isRiasecCode(interest.code) ? [{ ...interest, code: interest.code }] : [],
  );
  const firstInterest = rankedInterests[0] ?? {
    code: 'I' as RiasecCode,
    score: 0,
    average: 0,
  };
  const riasecCode =
    rankedInterests
      .slice(0, 3)
      .map((interest) => interest.code)
      .join('') || result.riasec.code;
  const orderedInterests = riasecCodes.map((code) => ({
    code,
    score: rankedInterests.find((interest) => interest.code === code)?.score ?? 0,
  }));

  const calculatedRecommendations =
    result.entRecommendations ?? calculateEntRecommendations(result.riasec.interests);
  const savedPrimaryCode = calculatedRecommendations[0]?.code;
  const primaryCode =
    savedPrimaryCode && isEntSubjectPairCode(savedPrimaryCode) ? savedPrimaryCode : 'MATH_PHYSICS';
  const primaryPair = catalog.entPairs[primaryCode];
  const entContext = catalog.buildEntContext({
    riasecCode,
    firstRole: roleProfiles[0].title,
    secondRole: roleProfiles[1].title,
  });
  const planSteps = catalog.plan.buildSteps({
    pair: primaryPair.title,
    firstRole: roleProfiles[0].title,
    secondRole: roleProfiles[1].title,
    studyTool: catalog.riasec[firstInterest.code].studyTool,
  });

  return (
    <main className="min-h-[calc(100vh-82px)] px-3 py-7 sm:px-6 sm:py-11" id="top">
      <div className="mx-auto max-w-[1080px]">
        <header className="mb-7 max-w-3xl sm:mb-9">
          <h1 className="mt-2 mb-0 text-[clamp(1.8rem,6vw,2.75rem)] leading-[1.08] font-[820] tracking-[-0.045em] text-[#172033]">
            {catalog.ui.title}
          </h1>
          <p className="mt-3 mb-0 max-w-2xl text-sm leading-6 text-[#646d79]">
            {catalog.ui.subtitle}
          </p>
        </header>

        <section
          className="mb-8 overflow-hidden rounded-2xl border border-[#d8ddd9] bg-white"
          aria-labelledby="overview-title">
          <h2 className="sr-only" id="overview-title">
            {catalog.ui.overviewEyebrow}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            <OverviewItem label={catalog.ui.mbtiLabel} position={0} emphasized>
              <span className="text-3xl tracking-[0.08em]">{mbti.type}</span>
            </OverviewItem>
            <OverviewItem label={catalog.ui.rolesLabel} position={1}>
              <span className="text-sm leading-5">
                {roleProfiles[0].title}
                <br />
                {roleProfiles[1].title}
              </span>
            </OverviewItem>
            <OverviewItem label={catalog.ui.riasecLabel} position={2}>
              <span className="text-2xl tracking-[0.14em]">{riasecCode}</span>
            </OverviewItem>
            <OverviewItem label={catalog.ui.entLabel} position={3}>
              <span className="text-sm leading-5">{primaryPair.title}</span>
            </OverviewItem>
          </div>
        </section>

        <section aria-labelledby="details-title">
          <h2 className="mb-3 text-sm font-[800] text-[#172033]" id="details-title">
            {catalog.ui.detailsIntro}
          </h2>

          <ReportDetails title={catalog.ui.mbtiSection} hint={catalog.ui.mbtiSectionHint}>
            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[0.82fr_1.18fr] lg:p-7">
              <div>
                <div className="rounded-xl border border-[#d8cdec] bg-[#f2edfa] p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <strong className="text-3xl tracking-[0.08em] text-[#2d2342]">
                      {mbti.type}
                    </strong>
                    <span className="text-sm font-bold text-[#57466f]">{mbtiProfile.title}</span>
                  </div>
                  <p className="mt-3 mb-0 text-sm leading-6 text-[#5e5570]">
                    {mbtiProfile.description}
                  </p>
                  <blockquote className="mt-4 mb-0 border-l-2 border-[#8268aa] pl-3 text-xs leading-5 font-semibold text-[#4c3d63]">
                    {mbtiProfile.quote}
                  </blockquote>
                </div>

                <h3 className="mt-6 mb-3 text-sm font-[800] text-[#172033]">
                  {catalog.ui.axesTitle}
                </h3>
                <div className="grid gap-4">
                  {mbti.axes.map((axis) => {
                    const level = getPreferenceLevel(axis.leftPercent, axis.rightPercent);
                    return (
                      <div key={axis.axis}>
                        <div className="mb-1.5 flex items-center justify-between gap-4 text-xs font-bold text-[#3d4653]">
                          <span>
                            {axis.left} · {axis.leftPercent}%
                          </span>
                          <span>
                            {axis.rightPercent}% · {axis.right}
                          </span>
                        </div>
                        <div
                          className="flex h-2.5 overflow-hidden rounded-full bg-[#e5e8e5]"
                          role="meter"
                          aria-label={`${axis.left}/${axis.right}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={axis.leftPercent}
                          aria-valuetext={`${axis.left} ${axis.leftPercent}%, ${axis.right} ${axis.rightPercent}%, ${catalog.ui.preferenceLevels[level]}`}>
                          <span
                            className="h-full bg-[#72cbb5]"
                            style={{ width: `${axis.leftPercent}%` }}
                          />
                          <span
                            className="h-full bg-[#8a72b3]"
                            style={{ width: `${axis.rightPercent}%` }}
                          />
                        </div>
                        <p className="mt-1.5 mb-0 text-[11px] font-bold text-[#707783]">
                          {catalog.ui.preferenceLevels[level]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <ProfileList
                  title={catalog.ui.strengths}
                  items={mbtiProfile.strengths}
                  tone="mint"
                />
                <ProfileList title={catalog.ui.risks} items={mbtiProfile.risks} tone="plain" />
                <ProfileList
                  title={catalog.ui.recommendations}
                  items={mbtiProfile.recommendations}
                  tone="purple"
                />
              </div>
            </div>
          </ReportDetails>

          <ReportDetails title={catalog.ui.teamSection} hint={catalog.ui.teamSectionHint}>
            <div className="p-4 sm:p-6 lg:p-7">
              <div className="grid gap-3 md:grid-cols-2">
                {leadingRoles.map((role, index) => {
                  const profile = roleProfiles[index];
                  return (
                    <article
                      className="rounded-xl border border-[#dde1de] bg-[#fafbf9] p-4"
                      key={role.code}>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="m-0 text-base font-[800] text-[#172033]">{profile.title}</h3>
                        <span className="shrink-0 text-xs font-bold text-[#3e7c6c]">
                          {role.score}%
                        </span>
                      </div>
                      <p className="mt-2 mb-0 text-xs leading-5 text-[#68717c]">
                        {profile.description}
                      </p>
                      <p className="mt-4 mb-1 text-[10px] font-bold tracking-[0.08em] text-[#66706e] uppercase">
                        {catalog.ui.roleBenefit}
                      </p>
                      <p className="m-0 text-xs leading-5 font-semibold text-[#303a47]">
                        {profile.entBenefit}
                      </p>
                    </article>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h3 className="m-0 text-sm font-[800] text-[#172033]">
                    {catalog.ui.combinedStrengths}
                  </h3>
                  <ul className="mt-3 mb-0 grid gap-2 p-0">
                    {combinedStrengths.map((strength) => (
                      <li
                        className="list-none rounded-lg bg-[#eaf6f2] px-3 py-2 text-xs font-semibold text-[#315e53]"
                        key={strength}>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="m-0 text-sm font-[800] text-[#172033]">
                    {catalog.ui.riskReduction}
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {riskMitigations.map((item, index) => (
                      <div
                        className="grid gap-1 rounded-lg border border-[#e0e2df] p-3 sm:grid-cols-[0.85fr_1.15fr] sm:gap-4"
                        key={`${item.risk}-${index}`}>
                        <p className="m-0 text-xs leading-5 font-semibold text-[#4d5662]">
                          {item.risk}
                        </p>
                        <p className="m-0 text-xs leading-5 text-[#626a75]">
                          <span className="mr-1 font-bold text-[#6e5890]">
                            {catalog.ui.riskArrowLabel}:
                          </span>
                          {item.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ReportDetails>

          <ReportDetails title={catalog.ui.riasecSection} hint={catalog.ui.riasecSectionHint}>
            <div className="grid gap-x-8 gap-y-5 p-4 sm:p-6 md:grid-cols-2 lg:p-7">
              {orderedInterests.map((interest) => {
                const profile = catalog.riasec[interest.code];
                return (
                  <article key={interest.code}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <h3 className="m-0 text-sm font-[800] text-[#172033]">
                        <span className="mr-2 text-[#3c7768]">{interest.code}</span>
                        {profile.title}
                      </h3>
                      <span className="text-xs font-bold text-[#4e5865]">{interest.score}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-[#e3e7e3]"
                      role="meter"
                      aria-label={`${interest.code} — ${profile.title}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={interest.score}
                      aria-valuetext={`${interest.score}%`}>
                      <span
                        className="block h-full rounded-full bg-[#72cbb5]"
                        style={{ width: `${interest.score}%` }}
                      />
                    </div>
                    <p className="mt-2 mb-0 text-xs leading-5 text-[#6c747f]">
                      {profile.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </ReportDetails>
        </section>

        <section
          className="mt-8 rounded-2xl border border-[#d1dfda] bg-[#eef8f4] p-4 sm:p-6"
          aria-labelledby="ent-title">
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="m-0 text-[10px] font-bold tracking-[0.1em] text-[#477b6d] uppercase">
                {catalog.ui.entTitle}
              </p>
              <h2 className="mt-2 mb-0 text-xl leading-7 font-[820] text-[#172033]" id="ent-title">
                {primaryPair.title}
              </h2>
              <p className="mt-2 mb-0 text-xs leading-5 text-[#62736d]">{catalog.ui.entIntro}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="m-0 text-xs font-[800] text-[#172033]">{catalog.ui.whyItFits}</h3>
                <p className="mt-2 mb-0 text-xs leading-5 text-[#52635e]">
                  {primaryPair.fit} {entContext}
                </p>
              </div>
              <div>
                <h3 className="m-0 text-xs font-[800] text-[#172033]">{catalog.ui.directions}</h3>
                <ul className="mt-2 mb-0 grid gap-1.5 text-xs leading-5 text-[#52635e]">
                  {primaryPair.directions.map((direction) => (
                    <li key={direction}>{direction}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="plan-title">
          <div className="mb-4 max-w-2xl">
            <h2
              className="m-0 text-xl font-[820] tracking-[-0.02em] text-[#172033]"
              id="plan-title">
              {catalog.ui.planTitle}
            </h2>
            <p className="mt-2 mb-0 text-xs leading-5 text-[#68717c]">{catalog.ui.planIntro}</p>
          </div>
          <ol className="m-0 grid gap-3 p-0 lg:grid-cols-5">
            {planSteps.map((step, index) => (
              <li
                className="list-none rounded-xl border border-[#d9ddda] bg-white p-4"
                key={catalog.plan.dayTitles[index]}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold tracking-[0.08em] text-[#5a6570] uppercase">
                    {catalog.ui.dayLabel} {index + 1}
                  </span>
                  <span className="rounded-full bg-[#efe9f7] px-2.5 py-1 text-[10px] font-bold text-[#5e4a7a]">
                    {catalog.plan.durations[index]} {catalog.ui.durationLabel}
                  </span>
                </div>
                <h3 className="mt-4 mb-0 text-sm font-[800] text-[#172033]">
                  {catalog.plan.dayTitles[index]}
                </h3>
                <p className="mt-2 mb-0 text-xs leading-5 text-[#626b76]">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-8 mb-6 border-t border-[#d9ddda] pt-5 flex flex-col-reverse sm:flex sm:items-center sm:justify-between gap-2 sm:gap-6">
          <p className="m-0 max-w-3xl text-center text-[10px] leading-5 text-[#626b73]">
            {catalog.ui.disclaimer}
          </p>
          <Link
            className="result-primary-link mt-4 shrink-0 sm:mt-0"
            href={`/${locale}`}
            onClick={clearQuestionnaireStorage}>
            {catalog.ui.newAttempt}
          </Link>
        </footer>
      </div>
    </main>
  );
}

function OverviewItem({
  label,
  children,
  position,
  emphasized = false,
}: {
  label: string;
  children: React.ReactNode;
  position: 0 | 1 | 2 | 3;
  emphasized?: boolean;
}) {
  const borders = [
    'border-b border-[#e1e4e1] sm:border-r lg:border-b-0',
    'border-b border-[#e1e4e1] lg:border-r lg:border-b-0',
    'border-b border-[#e1e4e1] sm:border-r sm:border-b-0',
    '',
  ] as const;

  return (
    <div className={`min-w-0 p-2 sm:p-5 ${emphasized ? 'bg-[#f2edfa]' : ''} ${borders[position]}`}>
      <p className="m-0 text-[10px] font-bold tracking-[0.08em] text-[#69727d] uppercase">
        {label}
      </p>
      <div className="mt-2 font-[820] break-words text-[#172033]">{children}</div>
    </div>
  );
}

function ReportDetails({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <details className="mb-3 overflow-hidden rounded-xl border border-[#d9ddda] bg-white open:shadow-[0_12px_36px_rgba(23,32,51,0.06)]">
      <summary className="cursor-pointer px-4 py-4 marker:text-[#5c9f8e] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#6d55a0] sm:px-5">
        <span className="ml-1 inline-flex max-w-[calc(100%_-_24px)] flex-col align-middle sm:flex-row sm:items-baseline sm:gap-3">
          <span className="text-sm font-[800] text-[#172033]">{title}</span>
          <span className="mt-0.5 text-[11px] leading-4 text-[#68717c] sm:mt-0">{hint}</span>
        </span>
      </summary>
      <div className="border-t border-[#e2e5e2]">{children}</div>
    </details>
  );
}

function ProfileList({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone: 'mint' | 'purple' | 'plain';
}) {
  const tones = {
    mint: 'border-[#d3e8e1] bg-[#f0f8f5]',
    purple: 'border-[#ddd3ec] bg-[#f6f2fa]',
    plain: 'border-[#e0e2df] bg-[#fafbf9]',
  } as const;

  return (
    <section className={`rounded-xl border p-4 ${tones[tone]}`}>
      <h3 className="m-0 text-xs font-[800] text-[#172033]">{title}</h3>
      <ul className="mt-3 mb-0 grid gap-2 text-xs leading-5 text-[#59636f]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function ResultState({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-82px)] items-center justify-center px-3" id="top">
      <section className="flex w-full max-w-lg flex-col items-center rounded-2xl border border-[#d9ddda] bg-white p-7 text-center text-sm font-semibold text-[#66707c] [&_h1]:mb-0 [&_h1]:text-xl [&_h1]:font-[800] [&_h1]:text-[#172033] [&_p]:max-w-sm [&_p]:leading-6">
        {children}
      </section>
    </main>
  );
}
