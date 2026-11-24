import { ArgumentsHost, HttpException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { HttpExceptionFilter } from './HttpExceptionFilter';

class TestHttpException extends HttpException {
  constructor(status: number, response: string | object, exceptionMessage?: string) {
    super(response, status);
    if (exceptionMessage !== undefined) {
      this.message = exceptionMessage;
    }
  }
}

function capture(status: number, response: string | object, exceptionMessage?: string) {
  let statusCode = 0;
  let responseBody: unknown;
  const httpResponse = {
    status(value: number) {
      statusCode = value;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => httpResponse }),
  } as ArgumentsHost;

  new HttpExceptionFilter().catch(
    new TestHttpException(status, response, exceptionMessage),
    host,
  );
  return { statusCode, responseBody };
}

describe('HttpExceptionFilter', () => {
  it('formats validation arrays with details', () => {
    expect(capture(400, { message: ['name required', 'limit invalid'] })).toEqual({
      statusCode: 400,
      responseBody: {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: ['name required', 'limit invalid'],
      },
    });
  });

  it('uses a string response message', () => {
    expect(capture(401, 'Bearer token required')).toEqual({
      statusCode: 401,
      responseBody: {
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Bearer token required',
      },
    });
  });

  it.each([
    [400, 'VALIDATION_ERROR'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [413, 'PAYLOAD_TOO_LARGE'],
    [429, 'TOO_MANY_REQUESTS'],
  ])('maps status %i to %s', (status, error) => {
    expect(capture(status, 'failure')).toEqual({
      statusCode: status,
      responseBody: { statusCode: status, error, message: 'failure' },
    });
  });

  it('maps an unknown status to HTTP_ERROR', () => {
    expect(capture(418, 'Teapot')).toEqual({
      statusCode: 418,
      responseBody: { statusCode: 418, error: 'HTTP_ERROR', message: 'Teapot' },
    });
  });

  it('uses the exception message for an object response without message', () => {
    expect(capture(404, { error: 'Missing' }, 'Missing resource')).toEqual({
      statusCode: 404,
      responseBody: {
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Missing resource',
      },
    });
  });
});
