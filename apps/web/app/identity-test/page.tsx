"use client";

import { useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";

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
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-semibold">Identity test</h1>
      <input className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded border p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="rounded bg-black px-4 py-2 text-white" onClick={login}>Login</button>
      <button className="ml-2 rounded border px-4 py-2" onClick={loadProjects} disabled={!token}>Load projects</button>
      <p className="text-sm">{message}</p>
    </main>
  );
}