import { describe, expect, it } from 'vitest';
import { readJwtSecret } from './readJwtSecret';

describe('readJwtSecret', () => {
  it('rejects a missing secret without revealing a value', () => {
    expect(() => readJwtSecret({})).toThrowError('JWT_SECRET must be set to at least 32 characters');
  });

  it('rejects an empty secret', () => {
    expect(() => readJwtSecret({ JWT_SECRET: '' }))
      .toThrowError('JWT_SECRET must be set to at least 32 characters');
  });

  it.each(['   ', 's'.repeat(31)])('rejects a weak secret without revealing it', (secret) => {
    let message = '';
    try {
      readJwtSecret({ JWT_SECRET: secret });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toBe('JWT_SECRET must be set to at least 32 characters');
    expect(message).not.toContain(secret);
  });

  it('accepts a secret of exactly 32 characters', () => {
    const secret = 's'.repeat(32);
    expect(readJwtSecret({ JWT_SECRET: secret })).toBe(secret);
  });

  it('accepts a secret longer than 32 characters', () => {
    const secret = 's'.repeat(40);
    expect(readJwtSecret({ JWT_SECRET: secret })).toBe(secret);
  });
});
