export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

const allowedTransitions: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
  [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return allowedTransitions[from].includes(to);
}
