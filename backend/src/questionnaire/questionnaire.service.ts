import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { QUESTION_MODULES } from './questionnaire.constants';
import { calculateQuestionnaireResult } from './questionnaire.scoring';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function parseResult(resultJson: string | null) {
  if (!resultJson) return null;

  try {
    return JSON.parse(resultJson) as unknown;
  } catch {
    return null;
  }
}

@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  async createAttempt(userId: string) {
    const version = await this.prisma.questionnaireVersion.findFirst({
      orderBy: { number: 'desc' },
      select: { id: true, number: true },
    });

    if (!version) return { testAvailable: false as const };

    const attemptToken = randomBytes(32).toString('base64url');
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.testAttempt.updateMany({
        where: { userId, status: 'IN_PROGRESS' },
        data: { status: 'ABANDONED', abandonedAt: now },
      }),
      this.prisma.testAttempt.create({
        data: {
          userId,
          versionId: version.id,
          tokenHash: hashToken(attemptToken),
        },
      }),
    ]);

    return {
      testAvailable: true as const,
      attemptToken,
      version: version.number,
    };
  }

  private async getAttempt(token: string) {
    if (!token) throw new UnauthorizedException('Attempt token is required');

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        version: { include: { questions: true } },
        answers: true,
      },
    });

    if (!attempt) throw new UnauthorizedException('Invalid attempt token');
    return attempt;
  }

  async getSession(token: string, language: string) {
    const attempt = await this.getAttempt(token);
    const answerByQuestion = new Map(
      attempt.answers.map((answer) => [answer.questionId, answer.value]),
    );
    const moduleOrder = new Map(
      QUESTION_MODULES.map((module, index) => [module, index]),
    );
    const questions = [...attempt.version.questions].sort(
      (left, right) =>
        (moduleOrder.get(left.module as (typeof QUESTION_MODULES)[number]) ??
          99) -
          (moduleOrder.get(right.module as (typeof QUESTION_MODULES)[number]) ??
            99) ||
        left.sortOrder - right.sortOrder ||
        left.id.localeCompare(right.id),
    );

    return {
      status: attempt.status,
      version: attempt.version.number,
      answeredCount: attempt.answers.length,
      total: questions.length,
      questions: questions.map((question) => ({
        id: question.id,
        module: question.module,
        sortOrder: question.sortOrder,
        text:
          language === 'kk' && question.textKk
            ? question.textKk
            : question.textRu,
        answer: answerByQuestion.get(question.id) ?? null,
      })),
      result: parseResult(attempt.resultJson),
    };
  }

  async saveAnswer(token: string, questionId: string, value: number) {
    const attempt = await this.getAttempt(token);
    if (attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException('This attempt can no longer be changed');
    }

    const questionBelongsToAttempt = attempt.version.questions.some(
      (question) => question.id === questionId,
    );
    if (!questionBelongsToAttempt) {
      throw new BadRequestException('Question does not belong to this attempt');
    }

    await this.prisma.answer.upsert({
      where: {
        attemptId_questionId: { attemptId: attempt.id, questionId },
      },
      update: { value },
      create: { attemptId: attempt.id, questionId, value },
    });

    const answeredCount = await this.prisma.answer.count({
      where: { attemptId: attempt.id },
    });

    return {
      saved: true,
      answeredCount,
      total: attempt.version.questions.length,
    };
  }

  async complete(token: string) {
    const attempt = await this.getAttempt(token);
    if (attempt.status === 'COMPLETED') return parseResult(attempt.resultJson);
    if (attempt.status !== 'IN_PROGRESS') {
      throw new ConflictException('This attempt can no longer be completed');
    }
    if (attempt.answers.length !== attempt.version.questions.length) {
      throw new BadRequestException('Every question must be answered');
    }

    const answerByQuestion = new Map(
      attempt.answers.map((answer) => [answer.questionId, answer.value]),
    );
    const completedAt = new Date();
    const result = calculateQuestionnaireResult(
      attempt.version.questions.map((question) => ({
        module: question.module,
        scoreTarget: question.scoreTarget,
        reverseScored: question.reverseScored,
        value: answerByQuestion.get(question.id) as number,
      })),
      completedAt,
    );

    await this.prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        completedAt,
        resultJson: JSON.stringify(result),
      },
    });

    return result;
  }
}
