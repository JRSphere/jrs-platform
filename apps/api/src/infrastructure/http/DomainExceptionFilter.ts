import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DomainException } from '../../shared-kernel/exceptions/DomainException';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: ErrorResponse): void;
}

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter<DomainException> {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    response.status(this.statusCodeFor(exception.code)).json({
      statusCode: this.statusCodeFor(exception.code),
      error: exception.code,
      message: exception.message,
    });
  }

  private statusCodeFor(code: string): number {
    switch (code) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'NOT_FOUND':
        return 404;
      case 'CONFLICT':
        return 409;
      default:
        return 500;
    }
  }
}
