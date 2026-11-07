import { randomUUID } from 'crypto';
import { ValidationException } from '../../../../shared-kernel/exceptions/ValidationException';

export interface CreateProjectProps {
  name: string;
  ownerId: string;
  description?: string | null;
}

export interface RestoreProjectProps {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project {
  readonly id: string;
  name: string;
  description: string | null;
  readonly ownerId: string;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: RestoreProjectProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.ownerId = props.ownerId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateProjectProps): Project {
    const name = props.name.trim();
    Project.validateName(name);
    if (props.ownerId.trim().length === 0) {
      throw new ValidationException('Owner ID is required');
    }

    const now = new Date();
    return new Project({
      id: randomUUID(),
      name,
      description: props.description ?? null,
      ownerId: props.ownerId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: RestoreProjectProps): Project {
    return new Project(props);
  }

  rename(name: string): void {
    const trimmedName = name.trim();
    Project.validateName(trimmedName);
    this.name = trimmedName;
    this.updatedAt = new Date();
  }

  changeDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (name.length === 0) {
      throw new ValidationException('Project name is required');
    }
    if (name.length > 255) {
      throw new ValidationException('Project name cannot exceed 255 characters');
    }
  }
}
