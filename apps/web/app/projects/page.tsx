"use client";

import { useEffect, useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";
import { Card } from "@/components/ui/Card";
import { TiltCard } from "@/components/ui/TiltCard";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface ProjectPage {
  items: Project[];
  total: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jrs_token");
    if (!token) {
      setError("Sign in first to see your projects.");
      return;
    }
    api
      .get<ProjectPage>("/api/v1/projects", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setProjects(res.data.items))
      .catch(() => setError("Could not load projects. Your session may have expired."));
  }, []);

  return (
    <main className="relative mx-auto max-w-5xl space-y-8 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Projects</h1>

      {error && <p className="opacity-70">{error}</p>}
      {!error && projects === null && <p className="opacity-70">Loading…</p>}
      {projects?.length === 0 && <p className="opacity-70">No projects yet.</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p, i) => (
          <TiltCard key={p.id}>
            <Card title={p.name} delayMs={i * 80}>
              <p className="text-sm opacity-70">{p.description ?? "No description"}</p>
            </Card>
          </TiltCard>
        ))}
      </div>
    </main>
  );
}