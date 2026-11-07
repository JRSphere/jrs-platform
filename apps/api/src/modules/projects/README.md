# Projects module

## Overview

The projects module manages projects and the tasks that belong to them. It supports creating and listing projects, and creating, listing, editing, assigning and moving tasks between statuses.

## Architecture

- **Domain:** `Project` and `Task` entities, the `TaskStatus` value, task status transition rules, and task domain events.
- **Application:** use cases and queries, request/response DTOs, pagination types, and repository/event-publisher ports.
- **Infrastructure:** NestJS controllers and request validation, Prisma repository implementations, and the in-process event publisher.

The module has no imports from other feature modules. It stores `ownerId`, `assigneeId`, and `projectId` as plain string IDs; it does not depend on identity entities.

The application ports are `IProjectRepository`, `ITaskRepository`, and `IEventPublisher`. Their NestJS injection tokens are the symbols `PROJECT_REPOSITORY`, `TASK_REPOSITORY`, and `EVENT_PUBLISHER`.

## Use cases

| Use case or query | Purpose |
|---|---|
| `CreateProjectUseCase` | Creates and persists a project. |
| `ListProjectsQuery` | Returns a paginated project list. |
| `CreateTaskUseCase` | Creates a task for an existing project. |
| `GetProjectTasksQuery` | Returns a paginated task list for an existing project. |
| `UpdateTaskDetailsUseCase` | Updates task title, description, or due date. |
| `UpdateTaskStatusUseCase` | Changes task status when the transition is allowed. |
| `AssignTaskUseCase` | Assigns a task to an assignee ID. |

## Domain rules

Allowed task status transitions:

- `TODO` → `IN_PROGRESS`
- `IN_PROGRESS` → `TODO` or `DONE`
- `DONE` → `IN_PROGRESS`

Project names and task titles are trimmed, required, and limited to 255 characters. `Task.updateDetails` accepts partial changes: omitted fields stay unchanged, while `null` clears `description` or `dueDate`. It validates before mutation, so an invalid update leaves the task unchanged; an update with no fields is rejected.

## Domain events

Events are emitted only after the relevant repository save or update succeeds.

| Event | Fields | Published after |
|---|---|---|
| `TaskCreatedEvent` | `taskId`, `projectId`, nullable `assigneeId`, `timestamp` | A task is saved by `CreateTaskUseCase`. |
| `TaskAssignedEvent` | `taskId`, `projectId`, `assigneeId`, `timestamp` | A task with an assignee is saved by `CreateTaskUseCase`, or an assignment update succeeds in `AssignTaskUseCase`. |
| `TaskCompletedEvent` | `taskId`, `projectId`, `timestamp` | A status update to `DONE` succeeds. |

`InProcessEventPublisher` delivers events through Nest's `EventEmitter2`, synchronously emitting each under its class name.

## HTTP API

| Method | Path | Success |
|---|---|---:|
| `POST` | `/api/v1/projects` | 201 |
| `GET` | `/api/v1/projects` | 200 |
| `POST` | `/api/v1/projects/:projectId/tasks` | 201 |
| `GET` | `/api/v1/projects/:projectId/tasks` | 200 |
| `PATCH` | `/api/v1/tasks/:taskId` | 200 |
| `PATCH` | `/api/v1/tasks/:taskId/status` | 200 |
| `PATCH` | `/api/v1/tasks/:taskId/assignee` | 200 |

Both list routes accept `page` (default `1`, minimum `1`) and `limit` (default `20`, range `1`–`100`). Paginated responses have the shape `{ items, total, page, limit }`. Project items contain `id`, `name`, `description`, `ownerId`, `createdAt`, and `updatedAt`; task items contain `id`, `projectId`, `title`, `description`, `assigneeId`, `status`, `dueDate`, `createdAt`, and `updatedAt`.

The Swagger UI is at `/api/docs`; the OpenAPI JSON is at `/api/docs-json`. Domain exceptions return `{ statusCode, error, message }`: validation errors map to 400, not-found errors to 404, conflicts to 409, and other domain codes to 500. Request validation errors (invalid body, path or query values) use the default Nest 400 response, where `message` is a list.

## Database

The Prisma schema defines the PostgreSQL `projects` schema with two tables: `projects` and `tasks`. `tasks` has indexes on `project_id` and `status`; its `project_id` relation references `projects.id` and cascades on project deletion. `owner_id` and `assignee_id` are UUID columns without relations to other modules; there are no foreign keys to other modules.

## Running the tests

Run these scripts from `apps/api`:

```sh
pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
```

Integration and E2E test files require `DATABASE_URL` to name a database ending in `_test`; they throw if it does not.

## Known limitations

- There is no authentication yet. Project creation takes `ownerId` from the request body, and the unfiltered project list returns every project to any caller.
- Events are synchronous and in-process, with no durable event storage or retry. A publishing failure after a successful save or update does not roll back the database change.
- There are no HTTP delete endpoints or project editing endpoint.
