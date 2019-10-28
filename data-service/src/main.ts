import { NestFactory } from '@nestjs/core';
import { DataModule } from './data.module';

async function bootstrap() {
  const app = await NestFactory.create(DataModule);
  app.enableCors();
  await app.listen(3002);
}
bootstrap();
