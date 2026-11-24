import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: string[];
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: ErrorResponse): void;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const message = this.responseMessage(exceptionResponse);

    if (Array.isArray(message)) {
      response.status(statusCode).json({
        statusCode,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: message,
      });
      return;
    }

    const text = typeof message === 'string'
      ? message
      : typeof exception.message === 'string'
        ? exception.message
        : 'HTTP error';
    response.status(statusCode).json({
      statusCode,
      error: this.errorCode(statusCode),
      message: text,
    });
  }

  private responseMessage(response: string | object): string | string[] | undefined {
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = response.message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message;
      }
    }
    return undefined;
  }

  private errorCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 413:
        return 'PAYLOAD_TOO_LARGE';
      case 429:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'HTTP_ERROR';
    }
  }
}
