import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  MBTI_AXES,
  RIASEC_TARGETS,
  TEAM_ROLE_TARGETS,
  isValidScoringTarget,
} from '../questionnaire/questionnaire.constants';
import { SaveQuestionDto } from './dto/save-question.dto';

type QuestionConfiguration = Pick<
  SaveQuestionDto,
  'module' | 'scoreTarget' | 'reverseScored'
>;

function coverageFor(
  questions: Array<{ module: string; scoreTarget: string }>,
) {
  const teamRoles = new Set(
    questions
      .filter((question) => question.module === 'TEAM_ROLES')
      .map((question) => question.scoreTarget),
  );
  const riasec = new Set(
    questions
      .filter((question) => question.module === 'RIASEC')
      .map((question) => question.scoreTarget),
  );
  const mbtiTargets = new Set(
    questions
      .filter((question) => question.module === 'MBTI')
      .map((question) => question.scoreTarget),
  );

  const missingTeamRoles = TEAM_ROLE_TARGETS.filter(
    (target) => !teamRoles.has(target),
  );
  const missingMbtiAxes = MBTI_AXES.filter(
    ([left, right]) => !mbtiTargets.has(left) && !mbtiTargets.has(right),
  ).map(([left, right]) => `${left}${right}`);
  const missingRiasec = RIASEC_TARGETS.filter((target) => !riasec.has(target));

  return {
    TEAM_ROLES: {
      covered: TEAM_ROLE_TARGETS.length - missingTeamRoles.length,
      total: TEAM_ROLE_TARGETS.length,
      missing: missingTeamRoles,
    },
    MBTI: {
      covered: MBTI_AXES.length - missingMbtiAxes.length,
      total: MBTI_AXES.length,
      missing: missingMbtiAxes,
    },
    RIASEC: {
      covered: RIASEC_TARGETS.length - missingRiasec.length,
      total: RIASEC_TARGETS.length,
      missing: missingRiasec,
    },
  };
}

@Injectable()
export class AdminQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private validateConfiguration(question: QuestionConfiguration) {
    if (!isValidScoringTarget(question.module, question.scoreTarget)) {
      throw new BadRequestException(
        'Scoring target does not belong to the selected module',
      );
    }
    if (question.module === 'MBTI' && question.reverseScored) {
      throw new BadRequestException(
        'MBTI direction is configured through its target pole',
      );
    }
  }

  async getDraft() {
    const [questions, currentVersion] = await Promise.all([
      this.prisma.question.findMany({
        orderBy: [
          { module: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      this.prisma.questionnaireVersion.findFirst({
        orderBy: { number: 'desc' },
        select: {
          number: true,
          publishedAt: true,
          _count: { select: { questions: true } },
        },
      }),
    ]);
    const included = questions.filter((question) => question.included);
    const coverage = coverageFor(included);
    const missing = Object.values(coverage).flatMap((item) => item.missing);
    const hasChanges =
      currentVersion === null ||
      questions.some(
        (question) => question.updatedAt > currentVersion.publishedAt,
      );

    return {
      items: questions,
      total: questions.length,
      included: included.length,
      coverage,
      canPublish: included.length > 0 && missing.length === 0 && hasChanges,
      publishBlockedReason:
        included.length === 0
          ? 'Добавьте и включите вопросы.'
          : missing.length > 0
            ? `Не заполнены шкалы: ${missing.join(', ')}.`
            : !hasChanges
              ? 'После последней публикации изменений нет.'
              : null,
      currentVersion: currentVersion
        ? {
            number: currentVersion.number,
            publishedAt: currentVersion.publishedAt,
            questionCount: currentVersion._count.questions,
          }
        : null,
    };
  }

  async create(question: SaveQuestionDto) {
    this.validateConfiguration(question);
    return this.prisma.question.create({ data: question });
  }

  async update(id: string, question: SaveQuestionDto) {
    this.validateConfiguration(question);
    const existing = await this.prisma.question.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Question not found');

    return this.prisma.question.update({ where: { id }, data: question });
  }

  async publish() {
    const [draftQuestions, currentVersion] = await Promise.all([
      this.prisma.question.findMany({
        orderBy: [
          { module: 'asc' },
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      }),
      this.prisma.questionnaireVersion.findFirst({
        orderBy: { number: 'desc' },
        select: { publishedAt: true },
      }),
    ]);
    const questions = draftQuestions.filter((question) => question.included);
    const coverage = coverageFor(questions);
    const missing = Object.values(coverage).flatMap((item) => item.missing);
    if (questions.length === 0 || missing.length > 0) {
      throw new BadRequestException(
        questions.length === 0
          ? 'At least one question is required'
          : `Missing scoring coverage: ${missing.join(', ')}`,
      );
    }
    if (
      currentVersion &&
      !draftQuestions.some(
        (question) => question.updatedAt > currentVersion.publishedAt,
      )
    ) {
      throw new BadRequestException('There are no changes to publish');
    }

    const latest = await this.prisma.questionnaireVersion.aggregate({
      _max: { number: true },
    });
    const version = await this.prisma.questionnaireVersion.create({
      data: {
        number: (latest._max.number ?? 0) + 1,
        questions: {
          create: questions.map((question) => ({
            sourceQuestionId: question.id,
            textRu: question.textRu,
            textKk: question.textKk,
            module: question.module,
            sortOrder: question.sortOrder,
            scoreTarget: question.scoreTarget,
            reverseScored: question.reverseScored,
          })),
        },
      },
      select: {
        number: true,
        publishedAt: true,
        _count: { select: { questions: true } },
      },
    });

    return {
      number: version.number,
      publishedAt: version.publishedAt,
      questionCount: version._count.questions,
    };
  }
}
