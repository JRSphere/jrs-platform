export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');