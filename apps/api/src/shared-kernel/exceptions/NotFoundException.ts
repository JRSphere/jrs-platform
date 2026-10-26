import { DomainException } from './DomainException';

export class NotFoundException extends DomainException {
  readonly code = 'NOT_FOUND';
}