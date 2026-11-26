import { ConflictException, Controller, Get, INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../app.module';
import { Public } from './auth/Public';
import { configureApp } from './configureApp';

@Public()
@Controller()
class ProbeController {
  @Get('probe/error')
  error(): never {
    throw new Error('secret database detail');
  }

  @Get('probe/conflict')
  conflict(): never {
    throw new ConflictException('already exists');
  }
}

describe('Catch-all exception filter E2E', () => {
  let app: INestApplication;

  beforeEach(async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    try {
      await app.close();
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('returns a fixed 500 body without leaking the original error', async () => {
    const response = await supertest(app.getHttpServer()).get('/probe/error').expect(500);

    expect(response.body).toEqual({
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    expect(JSON.stringify(response.body)).not.toContain('secret database detail');
  });

  it('leaves conflict errors to the specific HTTP exception filter', async () => {
    const response = await supertest(app.getHttpServer()).get('/probe/conflict').expect(409);

    expect(response.body.error).toBe('CONFLICT');
  });

  it('formats an unknown route with the specific HTTP exception filter', async () => {
    const response = await supertest(app.getHttpServer()).get('/does-not-exist').expect(404);

    expect(response.body.error).toBe('NOT_FOUND');
  });
});
