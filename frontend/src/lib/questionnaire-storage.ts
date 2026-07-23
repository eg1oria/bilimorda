import type { QuestionnaireResult } from './questionnaire-types';

const ATTEMPT_TOKEN_KEY = 'bilimorda:assessment-token';
const LEGACY_ATTEMPT_TOKEN_KEY = 'assessmentToken';
const RESULT_KEY = 'bilimorda:questionnaire-result:v1';

type StoredResult = {
  storageVersion: 1;
  result: QuestionnaireResult;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCategoryScore(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.score === 'number' &&
    typeof value.average === 'number'
  );
}

function isMbtiAxis(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.axis === 'string' &&
    typeof value.left === 'string' &&
    typeof value.right === 'string' &&
    typeof value.letter === 'string' &&
    typeof value.score === 'number' &&
    typeof value.leftPercent === 'number' &&
    typeof value.rightPercent === 'number'
  );
}

function isQuestionnaireResult(value: unknown): value is QuestionnaireResult {
  if (!isRecord(value)) return false;
  if (![1, 2, 3].includes(value.algorithmVersion as number)) return false;
  if (typeof value.computedAt !== 'string') return false;
  if (!Array.isArray(value.teamRoles) || !value.teamRoles.every(isCategoryScore)) return false;
  if (!isRecord(value.mbti) || typeof value.mbti.type !== 'string') return false;
  if (!Array.isArray(value.mbti.axes) || !value.mbti.axes.every(isMbtiAxis)) return false;
  if (!isRecord(value.riasec) || typeof value.riasec.code !== 'string') return false;
  if (!Array.isArray(value.riasec.interests) || !value.riasec.interests.every(isCategoryScore)) {
    return false;
  }
  if (
    value.entRecommendations !== undefined &&
    (!Array.isArray(value.entRecommendations) ||
      !value.entRecommendations.every(
        (item) =>
          isRecord(item) && typeof item.code === 'string' && typeof item.score === 'number',
      ))
  ) {
    return false;
  }
  return true;
}

export function saveAttemptToken(token: string) {
  let saved = false;

  try {
    sessionStorage.setItem(ATTEMPT_TOKEN_KEY, token);
    sessionStorage.removeItem(LEGACY_ATTEMPT_TOKEN_KEY);
    saved = true;
  } catch {
    // The persistent copy below may still be available.
  }

  try {
    localStorage.setItem(ATTEMPT_TOKEN_KEY, token);
    saved = true;
  } catch {
    // Storage is optional; the caller decides whether this is a blocking error.
  }

  return saved;
}

export function readAttemptToken() {
  try {
    const sessionToken = sessionStorage.getItem(ATTEMPT_TOKEN_KEY);
    if (sessionToken) return sessionToken;

    const legacyToken = sessionStorage.getItem(LEGACY_ATTEMPT_TOKEN_KEY);
    if (legacyToken) {
      saveAttemptToken(legacyToken);
      return legacyToken;
    }
  } catch {
    // Fall back to persistent storage.
  }

  try {
    const persistentToken = localStorage.getItem(ATTEMPT_TOKEN_KEY);
    if (!persistentToken) return null;

    try {
      sessionStorage.setItem(ATTEMPT_TOKEN_KEY, persistentToken);
    } catch {
      // The persistent token is still usable.
    }
    return persistentToken;
  } catch {
    return null;
  }
}

export function saveQuestionnaireResult(result: QuestionnaireResult) {
  try {
    const stored: StoredResult = { storageVersion: 1, result };
    localStorage.setItem(RESULT_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export function readQuestionnaireResult() {
  try {
    const serialized = localStorage.getItem(RESULT_KEY);
    if (!serialized) return null;

    const stored = JSON.parse(serialized) as unknown;
    if (
      !isRecord(stored) ||
      stored.storageVersion !== 1 ||
      !isQuestionnaireResult(stored.result)
    ) {
      localStorage.removeItem(RESULT_KEY);
      return null;
    }

    return stored.result;
  } catch {
    return null;
  }
}

export function clearStoredQuestionnaireResult() {
  try {
    localStorage.removeItem(RESULT_KEY);
  } catch {
    // There is nothing else to clear when storage is unavailable.
  }
}

export function clearQuestionnaireStorage() {
  try {
    sessionStorage.removeItem(ATTEMPT_TOKEN_KEY);
    sessionStorage.removeItem(LEGACY_ATTEMPT_TOKEN_KEY);
  } catch {
    // Continue clearing the remaining stores.
  }

  try {
    localStorage.removeItem(ATTEMPT_TOKEN_KEY);
  } catch {
    // Continue clearing the cached result.
  }

  clearStoredQuestionnaireResult();
}
