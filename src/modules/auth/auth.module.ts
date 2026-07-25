import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { randomBytes } from 'crypto';
import { ApiKey } from './entities/api-key.entity';
import { User } from './entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthValidateController } from './auth-validate.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ProxyAwareThrottlerGuard } from '../../common/security/proxy-aware-throttler.guard';

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET?.trim()) {
    return process.env.JWT_SECRET.trim();
  }
  // Fall back to API_MASTER_KEY when set so a single secret can bootstrap both.
  if (process.env.API_MASTER_KEY?.trim()) {
    return process.env.API_MASTER_KEY.trim();
  }
  // Ephemeral secret — sessions die on restart. Prefer setting JWT_SECRET in production.
  return randomBytes(32).toString('hex');
}

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey, User], 'main'),
    JwtModule.register({
      global: true,
      secret: resolveJwtSecret(),
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController, AuthValidateController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: ProxyAwareThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
