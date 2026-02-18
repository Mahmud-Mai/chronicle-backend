import { ExceptionFilter, Catch, ArgumentsHost, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class SupertokensExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isUnauthorized = exception instanceof UnauthorizedException;
    const is401Error = 
      (exception as { statusCode?: number })?.statusCode === 401 ||
      (exception as { message?: string })?.message?.includes('session');

    if (isUnauthorized || is401Error) {
      response.status(401).json({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Invalid session or token',
      });
      return;
    }

    console.error('Unhandled exception:', exception);

    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'An unexpected error occurred',
    });
  }
}
