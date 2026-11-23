import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module';

const databaseUrl = process.env.DATABASE_URL;
const databaseName = databaseUrl
  ? new URL(databaseUrl).pathname.split('/').filter(Boolean).pop()
  : undefined;
if (!databaseName?.endsWith('_test')) {
  throw new Error('E2E tests require a DATABASE_URL with a database name ending in _test');
}

describe('JWT secret configuration E2E', () => {
  it('rejects application initialization when JWT_SECRET is missing', async () => {
    const savedSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      await expect(Test.createTestingModule({ imports: [AppModule] }).compile())
        .rejects.toThrow(/JWT_SECRET/);
    } finally {
      if (savedSecret === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = savedSecret;
      }
    }
  });
});
