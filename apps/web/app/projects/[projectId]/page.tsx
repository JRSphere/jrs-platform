"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";
import { Card } from "@/components/ui/Card";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

interface TaskPage {
  items: Task[];
  total: number;
}

const nextStatuses: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["TODO", "DONE"],
  DONE: ["IN_PROGRESS"],
};

const labels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const columns: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export default function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem("jrs_token");
    if (!token) {
      setError("Sign in first.");
      return;
    }
    api
      .get<TaskPage>(`/api/v1/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 50 },
      })
      .then((res) => {
        setError(null);
        setTasks(res.data.items);
      })
      .catch(() => setError("Could not load tasks. Your session may have expired."));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function move(task: Task, to: TaskStatus) {
    const token = localStorage.getItem("jrs_token");
    if (!token) return;
    setBusyId(task.id);
    setError(null);
    try {
      await api.patch(
        `/api/v1/tasks/${task.id}/status`,
        { status: to },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: to } : t)) ?? null);
    } catch {
      setError(`Could not move "${task.title}" to ${labels[to]}.`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="relative mx-auto max-w-5xl space-y-8 px-6 py-16">
      <Link href="/projects" className="text-sm opacity-70 no-underline hover:opacity-100">
        ← Back to projects
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>

      <AddTaskForm projectId={projectId} onCreated={load} />

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!error && tasks === null && <p className="opacity-70">Loading…</p>}
      {tasks?.length === 0 && <p className="opacity-70">No tasks yet. Add the first one above.</p>}

      <div className="grid gap-6 md:grid-cols-3">
        {columns.map((status) => {
          const inColumn = tasks?.filter((t) => t.status === status) ?? [];
          return (
            <section key={status} className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest opacity-70">
                {labels[status]} ({inColumn.length})
              </h2>
              {inColumn.map((task, i) => (
                <Card key={task.id} title={task.title} delayMs={i * 60}>
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses[status].map((to) => (
                      <button
                        key={to}
                        className="jrs-btn jrs-btn-ghost text-sm"
                        disabled={busyId === task.id}
                        onClick={() => move(task, to)}
                      >
                        → {labels[to]}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </section>
          );
        })}
      </div>
    </main>
  );
}