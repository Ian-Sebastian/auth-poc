import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import fetch from 'node-fetch';

async function bootstrap() {
  // @ts-ignore
  global.fetch = fetch;
  const auth = await NestFactory.create(AuthModule);
  await auth.listen(3001);
}
bootstrap();
