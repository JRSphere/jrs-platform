export class TaskCreatedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly assigneeId: string | null,
    public readonly timestamp: Date = new Date(),
  ) {}
}
