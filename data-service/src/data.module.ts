import { Module, MiddlewareConsumer } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { JwtModule } from '@nestjs/jwt';
import { JwksConfigService } from './security/jwks-config.service';
import { SecurityModule } from './security/security.module';
import { CookieParserMiddleware } from '@nest-middlewares/cookie-parser';

@Module({
  imports: [
    SecurityModule,
    JwtModule.registerAsync({
      imports: [SecurityModule],
      useExisting: JwksConfigService,
    }),
  ],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {
  constructor() {
    console.info('Data Module initialized!');
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieParserMiddleware).forRoutes(DataController);
  }
}
