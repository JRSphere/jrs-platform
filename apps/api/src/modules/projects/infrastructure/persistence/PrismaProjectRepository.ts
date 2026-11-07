import { Injectable } from '@nestjs/common';
import { NotFoundException } from '../../../../shared-kernel/exceptions/NotFoundException';
import { PrismaService } from '../../../../infrastructure/prisma/PrismaService';
import { Project } from '../../domain/entities/Project';
import { IProjectRepository } from '../../application/ports/IProjectRepository';

@Injectable()
export class PrismaProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(project: Project): Promise<Project> {
    const saved = await this.prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    return project ? this.toDomain(project) : null;
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
    return projects.map((project) => this.toDomain(project));
  }

  async update(project: Project): Promise<Project> {
    try {
      const updated = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          name: project.name,
          description: project.description,
          ownerId: project.ownerId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
      return this.toDomain(updated);
    } catch (error) {
      if (isMissingRecord(error)) {
        throw new NotFoundException('Project not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.deleteMany({ where: { id } });
  }

  private toDomain(project: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return Project.restore(project);
  }
}

function isMissingRecord(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
}
