import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieParserMiddleware } from '@nest-middlewares/cookie-parser';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieParserMiddleware);
  }
}
