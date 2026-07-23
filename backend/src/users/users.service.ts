import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { QuestionnaireService } from '../questionnaire/questionnaire.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionnaireService: QuestionnaireService,
  ) {}

  private async registrationResult(userId: string, created: boolean) {
    const attempt = await this.questionnaireService.createAttempt(userId);
    return { userId, created, ...attempt };
  }

  async register(profile: RegisterUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: profile.phone },
      select: { id: true },
    });

    if (existing) {
      const user = await this.prisma.user.update({
        where: { phone: profile.phone },
        data: profile,
        select: { id: true },
      });

      return this.registrationResult(user.id, false);
    }

    try {
      const user = await this.prisma.user.create({
        data: profile,
        select: { id: true },
      });

      return this.registrationResult(user.id, true);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const user = await this.prisma.user.update({
          where: { phone: profile.phone },
          data: profile,
          select: { id: true },
        });

        return this.registrationResult(user.id, false);
      }

      throw error;
    }
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        school: true,
        grade: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        attempts: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            _count: { select: { answers: true } },
            version: {
              select: {
                number: true,
                _count: { select: { questions: true } },
              },
            },
          },
        },
      },
    });

    return users.map(({ attempts, ...user }) => {
      const latest = attempts[0];
      return {
        ...user,
        latestAttempt: latest
          ? {
              id: latest.id,
              status: latest.status,
              startedAt: latest.startedAt,
              completedAt: latest.completedAt,
              answeredCount: latest._count.answers,
              total: latest.version._count.questions,
              version: latest.version.number,
            }
          : null,
      };
    });
  }

  async findOneAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        attempts: {
          orderBy: { startedAt: 'desc' },
          include: {
            version: { select: { number: true } },
            answers: {
              include: {
                question: {
                  select: {
                    id: true,
                    module: true,
                    sortOrder: true,
                    textRu: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      attempts: user.attempts.map((attempt) => ({
        id: attempt.id,
        status: attempt.status,
        version: attempt.version.number,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        abandonedAt: attempt.abandonedAt,
        result: attempt.resultJson
          ? (JSON.parse(attempt.resultJson) as unknown)
          : null,
        answers: attempt.answers
          .map((answer) => ({
            id: answer.id,
            value: answer.value,
            updatedAt: answer.updatedAt,
            question: answer.question,
          }))
          .sort(
            (left, right) =>
              left.question.module.localeCompare(right.question.module) ||
              left.question.sortOrder - right.question.sortOrder,
          ),
      })),
    };
  }
}
