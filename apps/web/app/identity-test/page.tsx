"use client";

import { useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";
import { Card } from "@/components/ui/Card";
import { TiltCard } from "@/components/ui/TiltCard";
import { CursorGlow } from "@/components/ui/CursorGlow";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

export default function IdentityTestPage() {
  const [email, setEmail] = useState("test5@example.com");
  const [password, setPassword] = useState("Secret123");
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function login() {
    try {
      const res = await api.post<{ accessToken: string }>("/api/v1/auth/login", { email, password });
      setToken(res.data.accessToken);
      setMessage("Logged in. Token received.");
    } catch {
      setMessage("Login failed. Check email and password.");
    }
  }

  async function loadProjects() {
    try {
      const res = await api.get("/api/v1/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`Projects loaded: ${JSON.stringify(res.data)}`);
    } catch {
      setMessage("Could not load projects.");
    }
  }

  return (
    <main className="relative mx-auto max-w-md space-y-6 p-6">
      <CursorGlow />
      <TiltCard>
        <Card title="Identity test">
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full rounded-lg border border-[var(--surface-border)] bg-transparent p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-2">
              <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-white transition hover:opacity-90" onClick={login}>Login</button>
              <button className="rounded-lg border border-[var(--surface-border)] px-4 py-2 transition hover:opacity-90 disabled:opacity-40" onClick={loadProjects} disabled={!token}>Load projects</button>
            </div>
            <p className="text-sm opacity-80">{message}</p>
          </div>
        </Card>
      </TiltCard>
    </main>
  );
}