import type { EntSubjectPairCode as CatalogEntSubjectPairCode } from '@/data/result-catalog.types';

export type QuestionModule = 'TEAM_ROLES' | 'MBTI' | 'RIASEC';
export type LikertValue = 1 | 2 | 3 | 4 | 5;
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export type CategoryScore = {
  code: string;
  score: number;
  average: number;
};

export type QuestionnaireResult = {
  algorithmVersion: 1 | 2 | 3;
  computedAt: string;
  teamRoles: CategoryScore[];
  mbti: {
    type: string;
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
  entRecommendations?: Array<{
    code: CatalogEntSubjectPairCode;
    score: number;
  }>;
};

export type EntSubjectPairCode = CatalogEntSubjectPairCode;

export type PublicQuestion = {
  id: string;
  module: QuestionModule;
  sortOrder: number;
  text: string;
  answer: LikertValue | null;
};

export type AttemptSession = {
  status: AttemptStatus;
  version: number;
  answeredCount: number;
  total: number;
  questions: PublicQuestion[];
  result: QuestionnaireResult | null;
};
