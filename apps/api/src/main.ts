import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './infrastructure/http/configureApp';
import { setupOpenApi } from './infrastructure/http/setupOpenApi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupOpenApi(app);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();