import { DomainException } from './DomainException';

export class ConflictException extends DomainException {
  readonly code = 'CONFLICT';
}