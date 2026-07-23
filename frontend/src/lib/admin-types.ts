import type {
  AttemptStatus,
  QuestionModule,
  QuestionnaireResult,
} from './questionnaire-types';

export type AdminUser = {
  id: string;
  fullName: string;
  school: string;
  grade: '10' | '11';
  phone: string;
  createdAt: string;
  updatedAt: string;
  latestAttempt: {
    id: string;
    status: AttemptStatus;
    startedAt: string;
    completedAt: string | null;
    answeredCount: number;
    total: number;
    version: number;
  } | null;
};

export type AdminUsersResponse = {
  items: AdminUser[];
  total: number;
  generatedAt: string;
};

export type AdminQuestion = {
  id: string;
  textRu: string;
  textKk: string | null;
  module: QuestionModule;
  sortOrder: number;
  scoreTarget: string;
  reverseScored: boolean;
  included: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminQuestionsResponse = {
  items: AdminQuestion[];
  total: number;
  included: number;
  coverage: Record<
    QuestionModule,
    { covered: number; total: number; missing: string[] }
  >;
  canPublish: boolean;
  publishBlockedReason: string | null;
  currentVersion: {
    number: number;
    publishedAt: string;
    questionCount: number;
  } | null;
};

export type AdminUserDetails = Omit<AdminUser, 'latestAttempt'> & {
  attempts: Array<{
    id: string;
    status: AttemptStatus;
    version: number;
    startedAt: string;
    completedAt: string | null;
    abandonedAt: string | null;
    result: QuestionnaireResult | null;
    answers: Array<{
      id: string;
      value: number;
      updatedAt: string;
      question: {
        id: string;
        module: QuestionModule;
        sortOrder: number;
        textRu: string;
      };
    }>;
  }>;
};
