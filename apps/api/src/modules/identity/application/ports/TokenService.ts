export interface TokenService {
  sign(payload: { sub: string; role: string }): Promise<string>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');