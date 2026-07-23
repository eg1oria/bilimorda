import type { PreferenceLevel } from '@/data/result-catalog';
import type { MbtiType } from '@/data/result-catalog';
import type { QuestionnaireResult } from './questionnaire-types';

const MBTI_AXES = [
  ['E', 'I'],
  ['S', 'N'],
  ['T', 'F'],
  ['J', 'P'],
] as const;

const MBTI_TYPE_PATTERN = /^[EI][SN][TF][JP]$/;

export type NormalizedMbtiAxis = {
  axis: string;
  left: string;
  right: string;
  letter: string;
  score: number;
  leftPercent: number;
  rightPercent: number;
};

export type NormalizedMbti = {
  type: MbtiType;
  axes: NormalizedMbtiAxis[];
  isNearestType: boolean;
};

function percentage(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeMbti(result: QuestionnaireResult['mbti']): NormalizedMbti {
  let isNearestType = result.type.includes('X');

  const axes = MBTI_AXES.map(([left, right], index) => {
    const saved = result.axes.find(
      (axis) =>
        axis.axis === `${left}${right}` ||
        (axis.left === left && axis.right === right),
    );
    const leftPercent = percentage(saved?.leftPercent, 50);
    const rightPercent = saved
      ? percentage(saved.rightPercent, 100 - leftPercent)
      : 100 - leftPercent;
    const balanced = leftPercent === rightPercent;
    const savedTypeLetter = result.type[index];

    if (balanced || saved?.letter === 'X' || savedTypeLetter === 'X') {
      isNearestType = true;
    }

    const letter = balanced
      ? left
      : saved?.letter === left || saved?.letter === right
        ? saved.letter
        : savedTypeLetter === left || savedTypeLetter === right
          ? savedTypeLetter
          : leftPercent > rightPercent
            ? left
            : right;

    return {
      axis: `${left}${right}`,
      left,
      right,
      letter,
      score: saved?.score ?? 0,
      leftPercent,
      rightPercent,
    };
  });

  const type = axes.map((axis) => axis.letter).join('');

  return {
    type: MBTI_TYPE_PATTERN.test(type) ? (type as MbtiType) : 'ESTJ',
    axes,
    isNearestType,
  };
}

export function getPreferenceLevel(
  leftPercent: number,
  rightPercent: number,
): PreferenceLevel {
  const difference = Math.abs(leftPercent - rightPercent);
  if (difference === 0) return 'balance';
  if (difference <= 10) return 'weak';
  if (difference <= 24) return 'moderate';
  return 'strong';
}
