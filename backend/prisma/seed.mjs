import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const expectedModuleCounts = {
  TEAM_ROLES: 18,
  MBTI: 24,
  RIASEC: 30,
};
const scoringTargets = {
  TEAM_ROLES: new Set([
    'PLANT',
    'RESOURCE_INVESTIGATOR',
    'COORDINATOR',
    'SHAPER',
    'MONITOR_EVALUATOR',
    'TEAMWORKER',
    'IMPLEMENTER',
    'COMPLETER_FINISHER',
    'SPECIALIST',
  ]),
  MBTI: new Set(['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P']),
  RIASEC: new Set(['R', 'I', 'A', 'S', 'E', 'C']),
};

function validateSeedData(value) {
  if (!Array.isArray(value) || value.length !== 72) {
    throw new Error('Question seed must contain exactly 72 questions');
  }

  const moduleCounts = new Map();
  const sortKeys = new Set();

  for (const [index, question] of value.entries()) {
    if (
      typeof question !== 'object' ||
      question === null ||
      typeof question.textRu !== 'string' ||
      question.textRu.trim().length === 0 ||
      typeof question.textKk !== 'string' ||
      question.textKk.trim().length === 0 ||
      typeof question.module !== 'string' ||
      typeof question.sortOrder !== 'number' ||
      !Number.isInteger(question.sortOrder) ||
      typeof question.scoreTarget !== 'string'
    ) {
      throw new Error(`Invalid question seed entry at index ${index}`);
    }

    const targets = scoringTargets[question.module];
    if (!targets?.has(question.scoreTarget)) {
      throw new Error(
        `Invalid score target ${question.scoreTarget} for ${question.module}`,
      );
    }

    const sortKey = `${question.module}:${question.sortOrder}`;
    if (sortKeys.has(sortKey)) {
      throw new Error(`Duplicate question sort key: ${sortKey}`);
    }

    sortKeys.add(sortKey);
    moduleCounts.set(
      question.module,
      (moduleCounts.get(question.module) ?? 0) + 1,
    );
  }

  for (const [module, expectedCount] of Object.entries(expectedModuleCounts)) {
    if (moduleCounts.get(module) !== expectedCount) {
      throw new Error(
        `Question seed must contain ${expectedCount} ${module} questions`,
      );
    }
  }

  return value;
}

async function loadSeedData() {
  const contents = await readFile(
    new URL('./seed-data.json', import.meta.url),
    'utf8',
  );
  return validateSeedData(JSON.parse(contents));
}

async function seed() {
  const questions = await loadSeedData();
  const [questionCount, versionCount] = await prisma.$transaction([
    prisma.question.count(),
    prisma.questionnaireVersion.count(),
  ]);

  if (questionCount > 0 || versionCount > 0) {
    if (questionCount === 0 || versionCount === 0) {
      throw new Error(
        'Database is partially initialized; refusing to overwrite existing data',
      );
    }

    console.log(
      `Seed skipped: database already has ${questionCount} questions and ${versionCount} versions`,
    );
    return;
  }

  await prisma.$transaction(
    async (transaction) => {
      await transaction.question.createMany({
        data: questions.map((question) => ({
          ...question,
          reverseScored: false,
          included: true,
        })),
      });

      const createdQuestions = await transaction.question.findMany();
      const questionsBySortKey = new Map(
        createdQuestions.map((question) => [
          `${question.module}:${question.sortOrder}`,
          question,
        ]),
      );

      await transaction.questionnaireVersion.create({
        data: {
          number: 1,
          questions: {
            create: questions.map((question) => {
              const sourceQuestion = questionsBySortKey.get(
                `${question.module}:${question.sortOrder}`,
              );

              if (!sourceQuestion) {
                throw new Error('Created question could not be resolved');
              }

              return {
                sourceQuestionId: sourceQuestion.id,
                textRu: question.textRu,
                textKk: question.textKk,
                module: question.module,
                sortOrder: question.sortOrder,
                scoreTarget: question.scoreTarget,
                reverseScored: false,
              };
            }),
          },
        },
      });
    },
    { timeout: 30_000 },
  );

  console.log('Seeded 72 questions and published questionnaire version 1');
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
