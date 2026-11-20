import { DomainException } from './DomainException';

export class UnauthorizedException extends DomainException {
  readonly code = 'UNAUTHORIZED';
}