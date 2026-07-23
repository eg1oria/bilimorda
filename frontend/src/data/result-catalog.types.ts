import type { Locale } from '@/i18n/config';

export const mbtiTypes = [
  'ISTJ',
  'ISFJ',
  'INFJ',
  'INTJ',
  'ISTP',
  'ISFP',
  'INFP',
  'INTP',
  'ESTP',
  'ESFP',
  'ENFP',
  'ENTP',
  'ESTJ',
  'ESFJ',
  'ENFJ',
  'ENTJ',
] as const;

export const teamRoleCodes = [
  'PLANT',
  'RESOURCE_INVESTIGATOR',
  'COORDINATOR',
  'SHAPER',
  'MONITOR_EVALUATOR',
  'TEAMWORKER',
  'IMPLEMENTER',
  'COMPLETER_FINISHER',
  'SPECIALIST',
] as const;

export const riasecCodes = ['R', 'I', 'A', 'S', 'E', 'C'] as const;

export const entSubjectPairCodes = [
  'MATH_PHYSICS',
  'MATH_GEOGRAPHY',
  'WORLD_HISTORY_GEOGRAPHY',
  'BIOLOGY_CHEMISTRY',
  'BIOLOGY_GEOGRAPHY',
  'FOREIGN_LANGUAGE_WORLD_HISTORY',
  'LANGUAGE_LITERATURE',
  'GEOGRAPHY_FOREIGN_LANGUAGE',
  'CHEMISTRY_PHYSICS',
  'WORLD_HISTORY_LAW',
  'MATH_INFORMATICS',
] as const;

export type MbtiType = (typeof mbtiTypes)[number];
export type TeamRoleCode = (typeof teamRoleCodes)[number];
export type RiasecCode = (typeof riasecCodes)[number];
export type EntSubjectPairCode = (typeof entSubjectPairCodes)[number];
export type PreferenceLevel = 'balance' | 'weak' | 'moderate' | 'strong';

type FourItems = readonly [string, string, string, string];
type ThreeItems = readonly [string, string, string];

export type MbtiProfile = {
  title: string;
  description: string;
  strengths: FourItems;
  risks: FourItems;
  recommendations: FourItems;
  quote: string;
};

export type TeamRoleProfile = {
  title: string;
  description: string;
  entBenefit: string;
  strengths: ThreeItems;
  riskMitigations: readonly [
    { risk: string; mitigation: string },
    { risk: string; mitigation: string },
    { risk: string; mitigation: string },
  ];
};

export type RiasecProfile = {
  title: string;
  description: string;
  studyTool: string;
};

export type EntPairProfile = {
  title: string;
  fit: string;
  directions: ThreeItems;
};

export type ResultCatalog = {
  ui: {
    loading: string;
    title: string;
    subtitle: string;
    overviewEyebrow: string;
    mbtiLabel: string;
    nearestType: string;
    rolesLabel: string;
    riasecLabel: string;
    entLabel: string;
    detailsIntro: string;
    mbtiSection: string;
    mbtiSectionHint: string;
    strengths: string;
    risks: string;
    recommendations: string;
    axesTitle: string;
    preferenceLevels: Record<PreferenceLevel, string>;
    teamSection: string;
    teamSectionHint: string;
    roleBenefit: string;
    combinedStrengths: string;
    riskReduction: string;
    riskArrowLabel: string;
    riasecSection: string;
    riasecSectionHint: string;
    entTitle: string;
    entIntro: string;
    whyItFits: string;
    directions: string;
    planTitle: string;
    planIntro: string;
    dayLabel: string;
    durationLabel: string;
    noResultTitle: string;
    noResultText: string;
    backToTest: string;
    newAttempt: string;
    disclaimer: string;
  };
  mbti: Record<MbtiType, MbtiProfile>;
  teamRoles: Record<TeamRoleCode, TeamRoleProfile>;
  riasec: Record<RiasecCode, RiasecProfile>;
  entPairs: Record<EntSubjectPairCode, EntPairProfile>;
  buildEntContext: (input: {
    riasecCode: string;
    firstRole: string;
    secondRole: string;
  }) => string;
  plan: {
    dayTitles: readonly [string, string, string, string, string];
    durations: readonly ['60', '90', '45–60', '60', '60–75'];
    buildSteps: (input: {
      pair: string;
      firstRole: string;
      secondRole: string;
      studyTool: string;
    }) => readonly [string, string, string, string, string];
  };
};

export type ResultCatalogs = Record<Locale, ResultCatalog>;

export function isMbtiType(value: string): value is MbtiType {
  return (mbtiTypes as readonly string[]).includes(value);
}

export function isTeamRoleCode(value: string): value is TeamRoleCode {
  return (teamRoleCodes as readonly string[]).includes(value);
}

export function isRiasecCode(value: string): value is RiasecCode {
  return (riasecCodes as readonly string[]).includes(value);
}

export function isEntSubjectPairCode(value: string): value is EntSubjectPairCode {
  return (entSubjectPairCodes as readonly string[]).includes(value);
}
