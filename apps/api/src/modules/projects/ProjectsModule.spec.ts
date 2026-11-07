import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/PrismaService';
import { AssignTaskUseCase } from './application/use-cases/AssignTaskUseCase';
import { CreateProjectUseCase } from './application/use-cases/CreateProjectUseCase';
import { CreateTaskUseCase } from './application/use-cases/CreateTaskUseCase';
import { GetProjectTasksQuery } from './application/use-cases/GetProjectTasksQuery';
import { UpdateTaskStatusUseCase } from './application/use-cases/UpdateTaskStatusUseCase';
import { UpdateTaskDetailsUseCase } from './application/use-cases/UpdateTaskDetailsUseCase';
import { ProjectsModule } from './ProjectsModule';

describe('ProjectsModule', () => {
  let moduleRef: TestingModule | undefined;

  afterEach(async () => {
    await moduleRef?.close();
  });

  it.each([
    CreateProjectUseCase,
    CreateTaskUseCase,
    GetProjectTasksQuery,
    UpdateTaskStatusUseCase,
    AssignTaskUseCase,
    UpdateTaskDetailsUseCase,
  ])('resolves %s', async (useCase) => {
    moduleRef = await Test.createTestingModule({ imports: [ProjectsModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(useCase)).toBeInstanceOf(useCase);
  });
});
