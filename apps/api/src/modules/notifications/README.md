# Notifications

## Overview

The notifications module creates and lists task-assignment notifications and
allows recipients to mark them as read.

## Layers

- `domain/` contains the notification entity and its type.
- `application/` contains repository contracts, DTOs, and use cases.
- `infrastructure/persistence/` implements the repository with Prisma.
- `infrastructure/events/` handles task assignment events.
- `infrastructure/http/` contains the authenticated API and HTTP DTOs.

## Use cases

- `CreateNotificationUseCase` validates and saves a notification.
- `ListNotificationsQuery` returns a recipient's paginated notifications.
- `CountUnreadNotificationsQuery` counts a recipient's unread notifications.
- `MarkNotificationReadUseCase` marks the recipient's notification as read.

## Task assignment events

`TaskAssignedListener` subscribes to the `TaskAssignedEvent` event name and
creates a notification for its assignee. It catches and logs failures and
never throws them back to the event publisher.

## Routes

- `GET /api/v1/notifications`: `200` with a page; `400` for invalid query
  parameters; `401` when unauthenticated.
- `GET /api/v1/notifications/unread-count`: `200` with `{ count }`; `401`
  when unauthenticated.
- `PATCH /api/v1/notifications/:notificationId/read`: `200` with the updated
  notification; `400` for an invalid UUID; `401` when unauthenticated; `404`
  when the notification is missing or belongs to another recipient.

## Storage and tests

Notifications are stored in the `notifications.notifications` table.
From `apps/api`, run `pnpm test:unit`, `pnpm test:integration`, and
`pnpm test:e2e`. Integration and e2e tests require a `DATABASE_URL` whose
database name ends in `_test`.

## Limitations

- Self-assignment still creates a notification.
- The notification message is generic.
- No delivery channel is implemented.
- Events are in-process and are lost if the process dies, making this hard to
  scale reliably across processes.
