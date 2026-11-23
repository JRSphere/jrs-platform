import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module';
import { configureApp } from '../../../../infrastructure/http/configureApp';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { tokenFor } from '../../../../../test/support/signTestToken';

const databaseUrl = process.env.DATABASE_URL;
const databaseName = databaseUrl
  ? new URL(databaseUrl).pathname.split('/').filter(Boolean).pop()
  : undefined;
if (!databaseName?.endsWith('_test')) {
  throw new Error('E2E tests require a DATABASE_URL with a database name ending in _test');
}

let app: INestApplication;
let prisma: PrismaService;
const createdEmails: string[] = [];

function uniqueEmail(): string {
  const email = `auth-${randomUUID()}@example.com`;
  createdEmails.push(email);
  return email;
}

function registration(email = uniqueEmail()) {
  return { email, password: 'Valid-test-password1', firstName: 'Test', lastName: 'User' };
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  await app.close();
});

describe('JWT authentication E2E', () => {
  it('rejects requests without an Authorization header', async () => {
    await supertest(app.getHttpServer()).get('/api/v1/projects').expect(401);
  });

  it('rejects an authorization scheme other than Bearer', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Basic ${tokenFor(randomUUID())}`)
      .expect(401);
  });

  it('rejects a garbage token', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer garbage')
      .expect(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = new JwtService({ secret: 'different-test-secret-that-is-long-enough' })
      .sign({ sub: randomUUID(), role: 'EMPLOYEE' });

    await supertest(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects an expired token', async () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is required for e2e tests');
    }
    const token = new JwtService({ secret })
      .sign({ sub: randomUUID(), role: 'EMPLOYEE' }, { expiresIn: '-1s' });

    await supertest(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('accepts a valid token', async () => {
    await supertest(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenFor(randomUUID())}`)
      .expect(200);
  });

  it('registers without a token', async () => {
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(registration())
      .expect(201);
  });

  it('logs in without a token and uses the returned token on a protected route', async () => {
    const user = registration();
    await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(user)
      .expect(201);

    const login = await supertest(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));
    await supertest(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .expect(200);
  });

  it('serves the root route without a token', async () => {
    await supertest(app.getHttpServer()).get('/').expect(200);
  });
});
