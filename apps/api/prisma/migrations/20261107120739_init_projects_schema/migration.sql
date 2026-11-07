-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "projects";

-- CreateEnum
CREATE TYPE "projects"."TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "projects"."projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects"."tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "assignee_id" UUID,
    "status" "projects"."TaskStatus" NOT NULL DEFAULT 'TODO',
    "due_date" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_project_id_idx" ON "projects"."tasks"("project_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "projects"."tasks"("status");

-- AddForeignKey
ALTER TABLE "projects"."tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
