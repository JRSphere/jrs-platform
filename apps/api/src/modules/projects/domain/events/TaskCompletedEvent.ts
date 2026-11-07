export class TaskCompletedEvent {
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
