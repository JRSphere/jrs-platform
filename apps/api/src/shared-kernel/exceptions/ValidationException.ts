import { DomainException } from './DomainException';

export class ValidationException extends DomainException {
  readonly code = 'VALIDATION_ERROR';
}