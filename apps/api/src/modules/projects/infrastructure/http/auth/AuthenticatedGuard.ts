import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

interface AuthenticatedRequest {
  user?: { id?: unknown };
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // The identity JWT guard must set request.user.id; without it, requests are rejected.
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const id = request.user?.id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
