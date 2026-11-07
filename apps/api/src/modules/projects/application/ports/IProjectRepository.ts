import { Project } from '../../domain/entities/Project';

export interface IProjectRepository {
  save(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
}
