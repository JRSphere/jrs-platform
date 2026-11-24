export class TaskAssignedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly assigneeId: string,
    public readonly actorId: string = '',
    public readonly timestamp: Date = new Date(),
  ) {}
}
