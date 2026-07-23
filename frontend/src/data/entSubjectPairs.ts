import type {
  CategoryScore,
  EntSubjectPairCode,
} from '@/lib/questionnaire-types';

type PairDefinition = {
  code: EntSubjectPairCode;
  weights: Record<string, number>;
};

const PAIRS: PairDefinition[] = [
  { code: 'MATH_PHYSICS', weights: { I: 0.5, R: 0.3, C: 0.2 } },
  {
    code: 'MATH_GEOGRAPHY',
    weights: { I: 0.4, C: 0.25, R: 0.2, E: 0.15 },
  },
  {
    code: 'WORLD_HISTORY_GEOGRAPHY',
    weights: { I: 0.35, S: 0.25, A: 0.2, E: 0.2 },
  },
  { code: 'BIOLOGY_CHEMISTRY', weights: { I: 0.55, R: 0.25, C: 0.2 } },
  {
    code: 'BIOLOGY_GEOGRAPHY',
    weights: { I: 0.4, R: 0.3, S: 0.2, A: 0.1 },
  },
  {
    code: 'FOREIGN_LANGUAGE_WORLD_HISTORY',
    weights: { A: 0.3, S: 0.3, I: 0.25, E: 0.15 },
  },
  { code: 'LANGUAGE_LITERATURE', weights: { A: 0.55, S: 0.3, I: 0.15 } },
  {
    code: 'GEOGRAPHY_FOREIGN_LANGUAGE',
    weights: { S: 0.3, A: 0.25, E: 0.25, I: 0.2 },
  },
  { code: 'CHEMISTRY_PHYSICS', weights: { I: 0.5, R: 0.35, C: 0.15 } },
  {
    code: 'WORLD_HISTORY_LAW',
    weights: { E: 0.35, S: 0.3, I: 0.2, C: 0.15 },
  },
  { code: 'MATH_INFORMATICS', weights: { I: 0.45, C: 0.35, R: 0.2 } },
];

export function calculateEntRecommendations(interests: CategoryScore[]) {
  const scores = new Map(interests.map((interest) => [interest.code, interest.score]));

  return PAIRS.map((pair, index) => ({
    code: pair.code,
    score:
      Math.round(
        Object.entries(pair.weights).reduce(
          (total, [target, weight]) => total + (scores.get(target) ?? 0) * weight,
          0,
        ) * 10,
      ) / 10,
    index,
  }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)
    .map(({ code, score }) => ({ code, score }));
}
