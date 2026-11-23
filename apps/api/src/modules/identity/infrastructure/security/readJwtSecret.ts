export function readJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length < 32 || secret.trim().length === 0) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }
  return secret;
}
