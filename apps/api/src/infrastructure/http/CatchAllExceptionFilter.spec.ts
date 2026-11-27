import { ArgumentsHost, Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { CatchAllExceptionFilter } from './CatchAllExceptionFilter';

function capture(exception: unknown) {
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

  new CatchAllExceptionFilter().catch(exception, host);
  return { statusCode, responseBody };
}

const expectedResponse = {
  statusCode: 500,
  error: 'INTERNAL_SERVER_ERROR',
  message: 'Internal server error',
};

describe('CatchAllExceptionFilter', () => {
  let logError: MockInstance<typeof Logger.prototype.error>;

  beforeEach(() => {
    logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logError.mockRestore();
  });

  it('returns the fixed 500 body for an Error', () => {
    expect(capture(new Error('database password leaked'))).toEqual({
      statusCode: 500,
      responseBody: expectedResponse,
    });
  });

  it('never includes the original error message in the response', () => {
    const secretMessage = 'internal failure details';
    expect(JSON.stringify(capture(new Error(secretMessage)).responseBody))
      .not.toContain(secretMessage);
  });

  it('returns the fixed 500 body for a non-Error thrown value', () => {
    expect(capture('unexpected string')).toEqual({
      statusCode: 500,
      responseBody: expectedResponse,
    });
  });

  it('logs the Error stack', () => {
    const error = new Error('failure');
    capture(error);
    expect(logError).toHaveBeenCalledWith(error.stack);
  });

  it('logs the string form of a non-Error thrown value', () => {
    capture('unexpected string');
    expect(logError).toHaveBeenCalledWith('unexpected string');
  });
});
