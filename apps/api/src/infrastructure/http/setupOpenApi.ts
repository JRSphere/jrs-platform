import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProjectsModule } from '../../modules/projects/ProjectsModule';

export function setupOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('JRSphere API')
    .setVersion('1.0')
    .setDescription('Projects module')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, { include: [ProjectsModule] });
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
}
