import { describe, expect, it } from 'vitest';
import { readPoolConfig } from './readPoolConfig';

describe('readPoolConfig', () => {
  it('uses defaults when both variables are unset', () => {
    expect(readPoolConfig({})).toEqual({
      max: 10,
      connectionTimeoutMillis: 5000,
    });
  });

  it('uses defaults when both variables are empty', () => {
    expect(readPoolConfig({ DB_POOL_MAX: '', DB_CONNECT_TIMEOUT_MS: '' })).toEqual({
      max: 10,
      connectionTimeoutMillis: 5000,
    });
  });

  it('returns valid values as numbers', () => {
    expect(readPoolConfig({ DB_POOL_MAX: '25', DB_CONNECT_TIMEOUT_MS: '7500' })).toEqual({
      max: 25,
      connectionTimeoutMillis: 7500,
    });
  });

  it.each(['0', '-1', 'abc', '1.5', ' 5', '5 '])(
    'rejects invalid DB_POOL_MAX %j',
    (value) => {
      expect(() => readPoolConfig({ DB_POOL_MAX: value }))
        .toThrowError('DB_POOL_MAX must be a positive integer');
    },
  );

  it.each(['0', '-1', 'abc', '1.5', ' 5', '5 '])(
    'rejects invalid DB_CONNECT_TIMEOUT_MS %j',
    (value) => {
      expect(() => readPoolConfig({ DB_CONNECT_TIMEOUT_MS: value }))
        .toThrowError('DB_CONNECT_TIMEOUT_MS must be a positive integer');
    },
  );
});
