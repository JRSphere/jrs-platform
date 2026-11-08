import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

export function configureApp(app: INestApplication): void {
  const defaultHelmet = helmet();
  const swaggerHelmet = helmet({
    contentSecurityPolicy: {
      directives: { scriptSrc: ["'self'", "'unsafe-inline'"] },
    },
  });
  app.use((request: Request, response: Response, next: NextFunction) => {
    const isSwaggerPath = request.path === '/api/docs' || request.path.startsWith('/api/docs/');
    (isSwaggerPath ? swaggerHelmet : defaultHelmet)(request, response, next);
  });

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== '*');
  if ((process.env.CORS_ORIGINS ?? '').trim().length > 0) {
    app.enableCors({ origin: origins, methods: ['GET', 'POST', 'PATCH', 'DELETE'] });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
