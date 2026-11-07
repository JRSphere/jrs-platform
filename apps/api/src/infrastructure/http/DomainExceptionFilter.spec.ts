import { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DomainException } from '../../shared-kernel/exceptions/DomainException';
import { DomainExceptionFilter } from './DomainExceptionFilter';

class TestDomainException extends DomainException {
  constructor(readonly code: string) {
    super('failure');
  }
}

describe('DomainExceptionFilter', () => {
  it.each([
    ['VALIDATION_ERROR', 400],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['OTHER', 500],
  ])('maps %s to status %i', (code, expectedStatus) => {
    let statusCode = 0;
    let responseBody: unknown;
    const response = {
      status(value: number) {
        statusCode = value;
        return this;
      },
      json(body: unknown) {
        responseBody = body;
      },
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;

    new DomainExceptionFilter().catch(new TestDomainException(code), host);

    expect(statusCode).toBe(expectedStatus);
    expect(responseBody).toEqual({
      statusCode: expectedStatus,
      error: code,
      message: 'failure',
    });
  });
});
