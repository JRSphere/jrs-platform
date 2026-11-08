import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

interface AuthenticatedRequest {
  user?: { id?: unknown };
}

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const id = context.switchToHttp().getRequest<AuthenticatedRequest>().user?.id;
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new UnauthorizedException();
    }
    return id;
  },
);
