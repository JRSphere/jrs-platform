"use client";

import { useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

export function AddTaskForm({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("jrs_token");
    if (!token) {
      setStatus("Sign in first.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await api.post(
        `/api/v1/projects/${projectId}/tasks`,
        { title: title.trim(), description: description.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTitle("");
      setDescription("");
      setStatus("Task added.");
      onCreated();
    } catch {
      setStatus("Could not add the task. Check the title and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="jrs-card space-y-3 p-6">
      <h2 className="text-lg font-semibold text-[var(--accent)]">Add task</h2>
      <input
        className="w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={255}
      />
      <textarea
        className="w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <button type="submit" className="jrs-btn" disabled={busy || !title.trim()}>
        {busy ? "Adding…" : "Add task"}
      </button>
      {status && <p className="text-sm opacity-80">{status}</p>}
    </form>
  );
}