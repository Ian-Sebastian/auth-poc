import { Module } from '@nestjs/common';
import { JwksConfigService } from './jwks-config.service';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { config } from '../../../config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: config.constants.secret,
      signOptions: { expiresIn: '30s' },
    }),
  ],
  providers: [
    JwksConfigService,
    UsersService,
    AuthService,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [JwksConfigService, AuthService],
})
export class SecurityModule {}
