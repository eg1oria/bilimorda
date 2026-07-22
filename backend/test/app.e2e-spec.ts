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

  afterAll(async () => {
    if (app) await app.close();
    rmSync(databasePath, { force: true });
  });
});
