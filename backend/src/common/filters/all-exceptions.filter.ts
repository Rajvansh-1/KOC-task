import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx    = host.switchToHttp();
    const res    = ctx.getResponse<Response>();
    const req    = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Extract a human-readable message
    let message = 'Internal server error';
    let code    = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      const resp = exceptionResponse as any;
      message = Array.isArray(resp?.message) ? resp.message.join(', ') : (resp?.message ?? resp ?? message);
      code = this.statusToCode(status);
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} → ${status}`, exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json({
      success: false,
      error: {
        code,
        message,
        statusCode: status,
      },
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? 'ERROR';
  }
}
