"use client";

import { useEffect, useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/layout/PageShell";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

interface Notification {
  id: string;
  type: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationPage {
  items: Notification[];
  total: number;
}

function authHeaders(): Record<string, string> | null {
  const token = localStorage.getItem("jrs_token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const headers = authHeaders();
    if (!headers) {
      setError("Sign in first to see notifications.");
      return;
    }
    api
      .get<NotificationPage>("/api/v1/notifications", { headers })
      .then((res) => setItems(res.data.items))
      .catch(() => setError("Could not load notifications. Your session may have expired."));
  }, []);

  async function markRead(n: Notification) {
    const headers = authHeaders();
    if (!headers) return;
    setBusyId(n.id);
    try {
      const res = await api.patch<{ readAt: string | null }>(
        `/api/v1/notifications/${n.id}/read`, {}, { headers },
      );
      setItems((prev) => prev?.map((x) =>
        (x.id === n.id ? { ...x, readAt: res.data.readAt } : x),
      ) ?? null);
    } catch {
      setError("Could not mark the notification as read.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell>
      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      {error && <p className="opacity-70">{error}</p>}
      {!error && items === null && <p className="opacity-70">Loading…</p>}
      {items?.length === 0 && <p className="opacity-70">You're all caught up.</p>}
      <div className="space-y-4">
        {items?.map((n, i) => (
          <Card key={n.id} title={n.readAt === null ? "New" : "Read"} delayMs={i * 60}>
            <p className="text-sm opacity-80">{n.message}</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs opacity-50">{new Date(n.createdAt).toLocaleString()}</p>
              {n.readAt === null && (
                <button
                  className="jrs-btn jrs-btn-ghost text-sm"
                  disabled={busyId === n.id}
                  onClick={() => markRead(n)}
                >
                  Mark as read
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}