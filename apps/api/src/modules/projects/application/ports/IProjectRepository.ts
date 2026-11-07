import { Project } from '../../domain/entities/Project';
import { Page, PageRequest } from '../dto/Pagination';

export interface IProjectRepository {
  save(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findAll(request: PageRequest): Promise<Page<Project>>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
