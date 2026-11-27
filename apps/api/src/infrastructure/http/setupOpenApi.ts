import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProjectsModule } from '../../modules/projects/ProjectsModule';
import { NotificationsModule } from '../../modules/notifications/NotificationsModule';
import { IdentityModule } from '../../modules/identity/IdentityModule';

export function setupOpenApi(app: INestApplication): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('JRSphere API')
    .setVersion('1.0')
    .setDescription('JRSphere API')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [ProjectsModule, NotificationsModule, IdentityModule],
  });
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
}
