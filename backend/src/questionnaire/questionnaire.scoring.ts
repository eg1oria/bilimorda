import {
  MBTI_AXES,
  RIASEC_TARGETS,
  TEAM_ROLE_TARGETS,
} from './questionnaire.constants';

type ScoredQuestion = {
  module: string;
  scoreTarget: string;
  reverseScored: boolean;
  value: number;
};

type CategoryScore = {
  code: string;
  score: number;
  average: number;
};

type EntRecommendation = {
  code: string;
  score: number;
};

type MbtiType = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`;

const ENT_PAIR_WEIGHTS = [
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
] as const;

export type QuestionnaireResult = {
  algorithmVersion: 3;
  computedAt: string;
  teamRoles: CategoryScore[];
  mbti: {
    type: MbtiType;
    axes: Array<{
      axis: string;
      left: string;
      right: string;
      letter: string;
      score: number;
      leftPercent: number;
      rightPercent: number;
    }>;
  };
  riasec: {
    code: string;
    interests: CategoryScore[];
  };
  entRecommendations: EntRecommendation[];
};

function round(value: number, precision = 1) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function calculateCategories(
  questions: ScoredQuestion[],
  module: string,
  targets: readonly string[],
) {
  const sourceOrder = new Map(targets.map((target, index) => [target, index]));

  return targets
    .map((code) => {
      const matching = questions.filter(
        (question) =>
          question.module === module && question.scoreTarget === code,
      );
      const average =
        matching.reduce(
          (sum, question) =>
            sum +
            (question.reverseScored ? 6 - question.value : question.value),
          0,
        ) / matching.length;

      return {
        code,
        average: round(average, 2),
        score: round(((average - 1) / 4) * 100),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        (sourceOrder.get(left.code) ?? 0) - (sourceOrder.get(right.code) ?? 0),
    );
}

function calculateEntRecommendations(interests: CategoryScore[]) {
  const scores = new Map(
    interests.map((interest) => [interest.code, interest.score]),
  );

  return ENT_PAIR_WEIGHTS.map((pair, index) => ({
    code: pair.code,
    score: round(
      Object.entries(pair.weights).reduce(
        (total, [target, weight]) => total + (scores.get(target) ?? 0) * weight,
        0,
      ),
    ),
    index,
  }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 3)
    .map(({ code, score }) => ({ code, score }));
}

export function calculateQuestionnaireResult(
  questions: ScoredQuestion[],
  computedAt = new Date(),
): QuestionnaireResult {
  const teamRoles = calculateCategories(
    questions,
    'TEAM_ROLES',
    TEAM_ROLE_TARGETS,
  );
  const interests = calculateCategories(questions, 'RIASEC', RIASEC_TARGETS);
  const mbtiQuestions = questions.filter(
    (question) => question.module === 'MBTI',
  );

  const axes = MBTI_AXES.map(([left, right]) => {
    const matching = mbtiQuestions.filter(
      (question) =>
        question.scoreTarget === left || question.scoreTarget === right,
    );
    const score = matching.reduce((sum, question) => {
      const direction = question.scoreTarget === left ? 1 : -1;
      return sum + (question.value - 3) * direction;
    }, 0);
    const maximum = matching.length * 2;
    const normalized = maximum === 0 ? 0 : score / maximum;
    const leftPercent = Math.round(((normalized + 1) / 2) * 100);

    return {
      axis: `${left}${right}`,
      left,
      right,
      // A four-letter type is easier to use as a profile lookup key. Exact
      // ties remain visible through the 50/50 percentages and use the stable
      // left pole only as the nearest-type fallback.
      letter: score >= 0 ? left : right,
      score,
      leftPercent,
      rightPercent: 100 - leftPercent,
    };
  });

  const mbtiType = axes.map((axis) => axis.letter).join('') as MbtiType;

  return {
    algorithmVersion: 3,
    computedAt: computedAt.toISOString(),
    teamRoles,
    mbti: {
      type: mbtiType,
      axes,
    },
    riasec: {
      code: interests
        .slice(0, 3)
        .map((interest) => interest.code)
        .join(''),
      interests,
    },
    entRecommendations: calculateEntRecommendations(interests),
  };
}
