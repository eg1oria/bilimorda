import type { QuestionModule } from '@/lib/questionnaire-types';

export const MODULE_LABELS: Record<QuestionModule, string> = {
  TEAM_ROLES: 'Командные роли',
  MBTI: 'MBTI',
  RIASEC: 'RIASEC',
};

export const SCORING_OPTIONS: Record<
  QuestionModule,
  Array<{ value: string; label: string }>
> = {
  TEAM_ROLES: [
    { value: 'PLANT', label: 'Генератор идей (Plant)' },
    { value: 'RESOURCE_INVESTIGATOR', label: 'Исследователь ресурсов' },
    { value: 'COORDINATOR', label: 'Координатор' },
    { value: 'SHAPER', label: 'Мотиватор (Shaper)' },
    { value: 'MONITOR_EVALUATOR', label: 'Аналитик-оценщик' },
    { value: 'TEAMWORKER', label: 'Командный игрок' },
    { value: 'IMPLEMENTER', label: 'Реализатор' },
    { value: 'COMPLETER_FINISHER', label: 'Доводчик' },
    { value: 'SPECIALIST', label: 'Специалист' },
  ],
  MBTI: [
    { value: 'E', label: 'E — Экстраверсия' },
    { value: 'I', label: 'I — Интроверсия' },
    { value: 'S', label: 'S — Ощущение' },
    { value: 'N', label: 'N — Интуиция' },
    { value: 'T', label: 'T — Мышление' },
    { value: 'F', label: 'F — Чувство' },
    { value: 'J', label: 'J — Суждение' },
    { value: 'P', label: 'P — Восприятие' },
  ],
  RIASEC: [
    { value: 'R', label: 'R — Реалистический' },
    { value: 'I', label: 'I — Исследовательский' },
    { value: 'A', label: 'A — Артистический' },
    { value: 'S', label: 'S — Социальный' },
    { value: 'E', label: 'E — Предпринимательский' },
    { value: 'C', label: 'C — Конвенциональный' },
  ],
};

export const ADMIN_STATUS_LABELS = {
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершён',
  ABANDONED: 'Отменён',
} as const;
