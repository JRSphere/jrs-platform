"use client";

import { useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";
import { Card } from "@/components/ui/Card";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

export function CreateProjectForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
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
        "/api/v1/projects",
        { name: name.trim(), description: description.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName("");
      setDescription("");
      setStatus("Project created.");
      onCreated();
    } catch {
      setStatus("Could not create the project. Check the name and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="New project">
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
        />
        <textarea
          className="w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <button type="submit" className="jrs-btn" disabled={busy || !name.trim()}>
          {busy ? "Creating…" : "Create project"}
        </button>
        {status && <p className="text-sm opacity-80">{status}</p>}
      </form>
    </Card>
  );
}