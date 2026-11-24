-- DropIndex
DROP INDEX "projects"."tasks_project_id_idx";

-- CreateIndex
CREATE INDEX "projects_owner_id_created_at_id_idx" ON "projects"."projects"("owner_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "tasks_project_id_created_at_id_idx" ON "projects"."tasks"("project_id", "created_at", "id");
