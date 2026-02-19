import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SUPERTOKENS_CONFIG, AuthConfig } from '../../config/supertokens.config';
import { SessionGuard } from './guards/session.guard';
import { PrismaService } from '../../prisma/prisma.service';

const supertokensConfigProvider = {
  provide: SUPERTOKENS_CONFIG,
  useFactory: (configService: ConfigService): AuthConfig => ({
    appId: 'chronicle',
    apiDomain: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    websiteDomain: configService.get('CORS_ORIGIN', 'http://localhost:3001'),
    connectionURI: configService.get('SUPERTOKENS_CONNECTION_URI', 'https://try.supertokens.com'),
    apiKey: configService.get('SUPERTOKENS_API_KEY'),
  }),
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [
    supertokensConfigProvider,
    SessionGuard,
    AuthService,
    PrismaService,
  ],
  exports: [AuthService, SessionGuard, SUPERTOKENS_CONFIG],
})
export class AuthModule {}
