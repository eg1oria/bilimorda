import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { configureApp } from './../src/app.setup';

type RegistrationResponse = {
  userId: string;
  created: boolean;
  testAvailable: boolean;
  attemptToken?: string;
};

type AdminUsersResponse = {
  total: number;
  items: Array<{
    id: string;
    fullName: string;
    school: string;
    grade: string;
    phone: string;
  }>;
};

type AdminQuestionResponse = { id: string };
type AdminDraftResponse = {
  canPublish: boolean;
  coverage: Record<
    string,
    { covered: number; total: number; missing: string[] }
  >;
};
type AttemptSessionResponse = {
  status: string;
  version: number;
  answeredCount: number;
  total: number;
  questions: Array<{ id: string; text: string; answer: number | null }>;
};
type CompletionResponse = {
  algorithmVersion: number;
  teamRoles: Array<{ code: string; score: number }>;
  mbti: { type: string };
  riasec: { code: string };
  entRecommendations: Array<{ code: string; score: number }>;
};
type AdminDetailsResponse = {
  attempts: Array<{ status: string; answers: unknown[] }>;
};

describe('Application (e2e)', () => {
  let app: NestExpressApplication;
  let databasePath: string;
  const adminApiKey = 'e2e-admin-api-key';

  beforeAll(async () => {
    const backendRoot = resolve(__dirname, '..');
    const databaseFile = `e2e-${process.pid}-${Date.now()}.db`;
    databasePath = join(backendRoot, 'prisma', databaseFile);
    writeFileSync(databasePath, '');
    process.env.DATABASE_URL = `file:./${databaseFile}`;
    process.env.ADMIN_API_KEY = adminApiKey;

    execFileSync(
      join(backendRoot, 'node_modules', '.bin', 'prisma'),
      ['migrate', 'deploy'],
      {
        cwd: backendRoot,
        env: process.env,
        stdio: 'pipe',
      },
    );

    // Load after the test database environment is ready: ConfigModule validates on import.
    const { AppModule } = jest.requireActual<
      typeof import('./../src/app.module')
    >('./../src/app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  it('reports a healthy API', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects an invalid registration', () => {
    return request(app.getHttpServer())
      .post('/api/users/registration')
      .send({
        fullName: 'Иван',
        school: 'Школа №1',
        grade: '9',
        phone: '123',
      })
      .expect(400);
  });

  it('rejects unknown registration fields', () => {
    return request(app.getHttpServer())
      .post('/api/users/registration')
      .send({
        fullName: 'Иванов Иван Иванович',
        school: 'Школа №1',
        grade: '10',
        phone: '+7 (999) 123-45-67',
        isAdmin: true,
      })
      .expect(400);
  });

  it('rejects oversized JSON bodies before validation', () => {
    return request(app.getHttpServer())
      .post('/api/users/registration')
      .send({
        fullName: 'Иванов Иван Иванович',
        school: 'А'.repeat(9_000),
        grade: '10',
        phone: '+7 (999) 123-45-67',
      })
      .expect(413);
  });

  it('creates a user and updates the same phone without changing its id', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/users/registration')
      .send({
        fullName: 'Иванов Иван Иванович',
        school: 'Школа №1',
        grade: '10',
        phone: '+7 (999) 123-45-67',
      })
      .expect(200);

    const firstBody = first.body as RegistrationResponse;
    expect(typeof firstBody.userId).toBe('string');
    expect(firstBody.created).toBe(true);

    const repeated = await request(app.getHttpServer())
      .post('/api/users/registration')
      .send({
        fullName: 'Иванов Иван',
        school: 'Лицей №2',
        grade: '11',
        phone: '8 999 123 45 67',
      })
      .expect(200);

    const repeatedBody = repeated.body as RegistrationResponse;
    expect(repeatedBody).toEqual({
      userId: firstBody.userId,
      created: false,
      testAvailable: false,
    });

    const adminResponse = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('x-admin-api-key', adminApiKey)
      .expect(200);

    const adminBody = adminResponse.body as AdminUsersResponse;
    expect(adminBody.total).toBe(1);
    expect(adminBody.items[0]).toMatchObject({
      id: firstBody.userId,
      fullName: 'Иванов Иван',
      school: 'Лицей №2',
      grade: '11',
      phone: '+79991234567',
    });
  });

  it('does not expose the admin list without its API key', () => {
    return request(app.getHttpServer()).get('/api/admin/users').expect(401);
  });

  it('does not expose the admin list with a wrong API key', () => {
    return request(app.getHttpServer())
      .get('/api/admin/users')
      .set('x-admin-api-key', 'wrong-admin-api-key')
      .expect(401);
  });

  it('protects question administration and validates scoring targets', async () => {
    await request(app.getHttpServer()).get('/api/admin/questions').expect(401);

    await request(app.getHttpServer())
      .post('/api/admin/questions')
      .set('x-admin-api-key', adminApiKey)
      .send({
        textRu: 'Некорректная цель вопроса',
        textKk: null,
        module: 'RIASEC',
        sortOrder: 1,
        scoreTarget: 'PLANT',
        reverseScored: false,
        included: true,
      })
      .expect(400);
  });

  it('publishes a complete draft and runs a resumable immutable attempt', async () => {
    const definitions = [
      ...[
        'PLANT',
        'RESOURCE_INVESTIGATOR',
        'COORDINATOR',
        'SHAPER',
        'MONITOR_EVALUATOR',
        'TEAMWORKER',
        'IMPLEMENTER',
        'COMPLETER_FINISHER',
        'SPECIALIST',
      ].map((target, index) => ({ module: 'TEAM_ROLES', target, index })),
      ...['E', 'S', 'T', 'J'].map((target, index) => ({
        module: 'MBTI',
        target,
        index,
      })),
      ...['R', 'I', 'A', 'S', 'E', 'C'].map((target, index) => ({
        module: 'RIASEC',
        target,
        index,
      })),
    ];

    let firstQuestionId = '';
    for (const definition of definitions) {
      const response = await request(app.getHttpServer())
        .post('/api/admin/questions')
        .set('x-admin-api-key', adminApiKey)
        .send({
          textRu: `Вопрос ${definition.module} ${definition.target}`,
          textKk:
            definition.module === 'TEAM_ROLES' && definition.index === 0
              ? 'Қазақша сұрақ мәтіні'
              : null,
          module: definition.module,
          sortOrder: definition.index + 1,
          scoreTarget: definition.target,
          reverseScored:
            definition.module === 'TEAM_ROLES' && definition.index === 0,
          included: true,
        })
        .expect(201);

      const questionBody = response.body as AdminQuestionResponse;
      if (!firstQuestionId) firstQuestionId = questionBody.id;
    }

    const draft = await request(app.getHttpServer())
      .get('/api/admin/questions')
      .set('x-admin-api-key', adminApiKey)
      .expect(200);
    const draftBody = draft.body as AdminDraftResponse;
    expect(draftBody.canPublish).toBe(true);
    expect(draftBody.coverage).toMatchObject({
      TEAM_ROLES: { covered: 9, total: 9, missing: [] },
      MBTI: { covered: 4, total: 4, missing: [] },
      RIASEC: { covered: 6, total: 6, missing: [] },
    });

    await request(app.getHttpServer())
      .post('/api/admin/questions/actions/publish')
      .set('x-admin-api-key', adminApiKey)
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({ number: 1, questionCount: 19 });
      });

    await request(app.getHttpServer())
      .post('/api/admin/questions/actions/publish')
      .set('x-admin-api-key', adminApiKey)
      .expect(400);

    const registration = await request(app.getHttpServer())
      .post('/api/users/registration')
      .send({
        fullName: 'Тестовый Ученик',
        school: 'Школа тестирования',
        grade: '10',
        phone: '+7 (701) 000-00-01',
      })
      .expect(200);
    const registrationBody = registration.body as RegistrationResponse;
    expect(registrationBody.testAvailable).toBe(true);
    expect(typeof registrationBody.attemptToken).toBe('string');
    const token = registrationBody.attemptToken as string;

    const session = await request(app.getHttpServer())
      .get('/api/questionnaire/attempt?lang=kk')
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    const sessionBody = session.body as AttemptSessionResponse;
    expect(sessionBody).toMatchObject({
      status: 'IN_PROGRESS',
      version: 1,
      answeredCount: 0,
      total: 19,
    });
    expect(sessionBody.questions[0].text).toBe('Қазақша сұрақ мәтіні');

    const publishedFirstQuestionId = sessionBody.questions[0].id;
    await request(app.getHttpServer())
      .put(`/api/questionnaire/answers/${publishedFirstQuestionId}`)
      .set('authorization', `Bearer ${token}`)
      .send({ value: 5 })
      .expect(200)
      .expect({ saved: true, answeredCount: 1, total: 19 });

    await request(app.getHttpServer())
      .post('/api/questionnaire/complete')
      .set('authorization', `Bearer ${token}`)
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/admin/questions/${firstQuestionId}`)
      .set('x-admin-api-key', adminApiKey)
      .send({
        textRu: 'Полностью изменённый текст вопроса',
        textKk: null,
        module: 'TEAM_ROLES',
        sortOrder: 1,
        scoreTarget: 'PLANT',
        reverseScored: true,
        included: true,
      })
      .expect(200);

    const unchangedSession = await request(app.getHttpServer())
      .get('/api/questionnaire/attempt?lang=ru')
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    const unchangedSessionBody =
      unchangedSession.body as AttemptSessionResponse;
    expect(unchangedSessionBody.questions[0].text).toBe(
      'Вопрос TEAM_ROLES PLANT',
    );
    expect(unchangedSessionBody.questions[0].answer).toBe(5);

    await request(app.getHttpServer())
      .post('/api/admin/questions/actions/publish')
      .set('x-admin-api-key', adminApiKey)
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({ number: 2, questionCount: 19 });
      });

    for (const question of unchangedSessionBody.questions.slice(1)) {
      await request(app.getHttpServer())
        .put(`/api/questionnaire/answers/${question.id}`)
        .set('authorization', `Bearer ${token}`)
        .send({ value: 5 })
        .expect(200);
    }

    const completion = await request(app.getHttpServer())
      .post('/api/questionnaire/complete')
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    const completionBody = completion.body as CompletionResponse;
    expect(completionBody).toMatchObject({
      algorithmVersion: 3,
      mbti: { type: 'ESTJ' },
      riasec: { code: 'RIA' },
      entRecommendations: [
        { code: 'MATH_PHYSICS' },
        { code: 'MATH_GEOGRAPHY' },
        { code: 'WORLD_HISTORY_GEOGRAPHY' },
      ],
    });
    expect(
      completionBody.teamRoles.find((role) => role.code === 'PLANT'),
    ).toMatchObject({
      score: 0,
    });

    await request(app.getHttpServer())
      .put(`/api/questionnaire/answers/${publishedFirstQuestionId}`)
      .set('authorization', `Bearer ${token}`)
      .send({ value: 1 })
      .expect(409);

    const repeated = await request(app.getHttpServer())
      .post('/api/users/registration')
      .send({
        fullName: 'Тестовый Ученик',
        school: 'Школа тестирования',
        grade: '10',
        phone: '+7 (701) 000-00-01',
      })
      .expect(200);
    const repeatedBody = repeated.body as RegistrationResponse;
    expect(repeatedBody.attemptToken).not.toBe(token);
    const repeatedSession = await request(app.getHttpServer())
      .get('/api/questionnaire/attempt?lang=ru')
      .set('authorization', `Bearer ${repeatedBody.attemptToken}`)
      .expect(200);
    const repeatedSessionBody = repeatedSession.body as AttemptSessionResponse;
    expect(repeatedSessionBody.version).toBe(2);
    expect(repeatedSessionBody.questions[0].text).toBe(
      'Полностью изменённый текст вопроса',
    );

    const details = await request(app.getHttpServer())
      .get(`/api/admin/users/${registrationBody.userId}`)
      .set('x-admin-api-key', adminApiKey)
      .expect(200);
    const detailsBody = details.body as AdminDetailsResponse;
    expect(detailsBody.attempts).toHaveLength(2);
    expect(detailsBody.attempts.map((attempt) => attempt.status)).toEqual([
      'IN_PROGRESS',
      'COMPLETED',
    ]);
    expect(detailsBody.attempts[1].answers).toHaveLength(19);
  });

  afterAll(async () => {
    if (app) await app.close();
    rmSync(databasePath, { force: true });
  });
});
