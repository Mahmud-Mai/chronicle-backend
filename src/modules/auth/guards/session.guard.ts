import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { SUPERTOKENS_CONFIG, AuthConfig } from '../../../config/supertokens.config';
import Session from 'supertokens-node/recipe/session';
import { SessionContainer } from 'supertokens-node/recipe/session';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(SUPERTOKENS_CONFIG) private config: AuthConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    try {
      const session = await Session.getSession(request, response, { sessionRequired: true });

      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }

      (request as Request & { session: SessionContainer }).session = session;
      
      return true;
    } catch (err) {
      const error = err as { type?: string; message?: string };
      if (error.type === 'TRY_REFRESH_TOKEN') {
        throw new UnauthorizedException('Session expired. Please login again.');
      }
      throw new UnauthorizedException('Invalid session');
    }
  }
}
