export const QUESTION_MODULES = ['TEAM_ROLES', 'MBTI', 'RIASEC'] as const;

export type QuestionModule = (typeof QUESTION_MODULES)[number];

export const TEAM_ROLE_TARGETS = [
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

export const MBTI_TARGETS = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'] as const;
export const MBTI_AXES = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const;
export const RIASEC_TARGETS = ['R', 'I', 'A', 'S', 'E', 'C'] as const;

export const SCORING_TARGETS = {
  TEAM_ROLES: TEAM_ROLE_TARGETS,
  MBTI: MBTI_TARGETS,
  RIASEC: RIASEC_TARGETS,
} as const;

export const ATTEMPT_STATUSES = [
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
] as const;

export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export function isQuestionModule(value: string): value is QuestionModule {
  return QUESTION_MODULES.includes(value as QuestionModule);
}

export function isValidScoringTarget(module: QuestionModule, target: string) {
  return (SCORING_TARGETS[module] as readonly string[]).includes(target);
}
