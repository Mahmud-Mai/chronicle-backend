import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuthConfig {
  appId: string;
  apiKey?: string;
  apiDomain: string;
  websiteDomain: string;
  connectionURI: string;
}

export const SUPERTOKENS_CONFIG = 'SUPERTOKENS_CONFIG';

export interface AuthConfigModuleOptions {
  useFactory: (configService: ConfigService) => AuthConfig;
}

export function createAuthConfigProvider(options: AuthConfigModuleOptions): Provider {
  return {
    provide: SUPERTOKENS_CONFIG,
    useFactory: options.useFactory,
  };
}
