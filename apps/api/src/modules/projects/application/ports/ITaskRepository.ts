import { Task } from '../../domain/entities/Task';
import { Page, PageRequest } from '../dto/Pagination';

export interface ITaskRepository {
  save(task: Task): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findByProjectId(projectId: string, request: PageRequest): Promise<Page<Task>>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
