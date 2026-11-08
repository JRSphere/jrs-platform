import { Body, Controller, Get, Post } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { configureApp } from './configureApp';
import { setupOpenApi } from './setupOpenApi';

@Controller()
class ProbeController {
  @Get('probe')
  get() {
    return { ok: true };
  }

  @Post('probe')
  post(@Body() body: { value?: string }) {
    return { length: body.value?.length ?? 0 };
  }
}

async function createApp(options: {
  throttling?: { limit: number; ttl: number };
  configure?: boolean;
} = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: options.throttling
      ? [ThrottlerModule.forRoot([options.throttling])]
      : [],
    controllers: [ProbeController],
    providers: options.throttling
      ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
      : [],
  }).compile();
  const app = moduleRef.createNestApplication();
  if (options.configure !== false) {
    configureApp(app);
  }
  return app;
}

function setEnvironment(name: string, value: string | undefined): () => void {
  const previous = process.env[name];
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
  return () => {
    if (previous === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = previous;
    }
  };
}

describe('HTTP hardening', () => {
  it('sets security headers and removes x-powered-by', async () => {
    const app = await createApp();
    try {
      await app.init();
      const response = await supertest(app.getHttpServer()).get('/probe').expect(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
      const scriptDirective = response.headers['content-security-policy'].match(/script-src [^;]*/);
      expect(scriptDirective).not.toBeNull();
      expect(scriptDirective?.[0]).not.toContain("'unsafe-inline'");
    } finally {
      await app.close();
    }
  });

  it('blocks requests after the configured rate limit', async () => {
    const app = await createApp({ configure: false, throttling: { limit: 2, ttl: 60_000 } });
    try {
      await app.init();
      await supertest(app.getHttpServer()).get('/probe').expect(200);
      await supertest(app.getHttpServer()).get('/probe').expect(200);
      await supertest(app.getHttpServer()).get('/probe').expect(429);
    } finally {
      await app.close();
    }
  });

  it('does not enable CORS when CORS_ORIGINS is unset', async () => {
    const restore = setEnvironment('CORS_ORIGINS', undefined);
    let app: INestApplication | undefined;
    try {
      app = await createApp();
      await app.init();
      const response = await supertest(app.getHttpServer())
        .get('/probe')
        .set('Origin', 'https://evil.example')
        .expect(200);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await app?.close();
      restore();
    }
  });

  it('allows only origins listed in CORS_ORIGINS', async () => {
    const restore = setEnvironment('CORS_ORIGINS', 'https://app.example');
    let app: INestApplication | undefined;
    try {
      app = await createApp();
      await app.init();
      const allowed = await supertest(app.getHttpServer())
        .get('/probe')
        .set('Origin', 'https://app.example')
        .expect(200);
      const denied = await supertest(app.getHttpServer())
        .get('/probe')
        .set('Origin', 'https://evil.example')
        .expect(200);
      expect(allowed.headers['access-control-allow-origin']).toBe('https://app.example');
      expect(denied.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
      await app?.close();
      restore();
    }
  });

  it('rejects JSON bodies larger than 100 KB', async () => {
    const app = await createApp();
    try {
      await app.init();
      await supertest(app.getHttpServer())
        .post('/probe')
        .send({ value: 'x'.repeat(200 * 1024) })
        .expect(413);
    } finally {
      await app.close();
    }
  });

  it('does not serve Swagger in production', async () => {
    const restore = setEnvironment('NODE_ENV', 'production');
    let app: INestApplication | undefined;
    try {
      app = await createApp();
      setupOpenApi(app);
      await app.init();
      await supertest(app.getHttpServer()).get('/api/docs-json').expect(404);
    } finally {
      await app?.close();
      restore();
    }
  });

  it('serves Swagger outside production without the default CSP blocking its UI', async () => {
    const restore = setEnvironment('NODE_ENV', 'test');
    let app: INestApplication | undefined;
    try {
      app = await createApp();
      setupOpenApi(app);
      await app.init();
      await supertest(app.getHttpServer()).get('/api/docs-json').expect(200);
      const ui = await supertest(app.getHttpServer()).get('/api/docs/').expect(200);
      expect(ui.headers['content-security-policy']).toContain("'unsafe-inline'");
    } finally {
      await app?.close();
      restore();
    }
  });
});
