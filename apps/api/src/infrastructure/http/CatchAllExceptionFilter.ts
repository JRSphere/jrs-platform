import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: ErrorResponse): void;
}

@Catch()
export class CatchAllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchAllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));

    const response = host.switchToHttp().getResponse<HttpResponse>();
    response.status(500).json({
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
}
