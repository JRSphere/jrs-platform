export class UserDeactivatedEvent {
  constructor(
    public readonly userId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}