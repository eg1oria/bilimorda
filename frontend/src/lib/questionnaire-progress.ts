import type { PublicQuestion } from './questionnaire-types';

export function exceedsNeutralAnswerLimit(
  questions: Pick<PublicQuestion, 'answer'>[],
  limit = 0.6,
) {
  if (questions.length === 0) return false;

  const neutralAnswers = questions.filter((question) => question.answer === 3).length;
  return neutralAnswers / questions.length > limit;
}
