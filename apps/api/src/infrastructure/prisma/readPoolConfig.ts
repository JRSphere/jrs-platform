export interface PoolConfig {
  max: number;
  connectionTimeoutMillis: number;
}

export function readPoolConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  return {
    max: readPositiveInteger(env.DB_POOL_MAX, 'DB_POOL_MAX', 10),
    connectionTimeoutMillis: readPositiveInteger(
      env.DB_CONNECT_TIMEOUT_MS,
      'DB_CONNECT_TIMEOUT_MS',
      5000,
    ),
  };
}

function readPositiveInteger(
  value: string | undefined,
  name: string,
  defaultValue: number,
): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  if (!/^[0-9]+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
