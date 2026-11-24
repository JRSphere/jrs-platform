"use client";

import { useEffect, useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";
import { Card } from "@/components/ui/Card";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationPage {
  items: Notification[];
  total: number;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("jrs_token");
    if (!token) {
      setError("Sign in first to see notifications.");
      return;
    }
    api
      .get<NotificationPage>("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setItems(res.data.items))
      .catch(() => setError("Could not load notifications. Your session may have expired."));
  }, []);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
      {error && <p className="opacity-70">{error}</p>}
      {!error && items === null && <p className="opacity-70">Loading…</p>}
      {items?.length === 0 && <p className="opacity-70">You're all caught up.</p>}
      <div className="space-y-4">
        {items?.map((n, i) => (
          <Card key={n.id} title={n.read ? "Read" : "New"} delayMs={i * 60}>
            <p className="text-sm opacity-80">{n.message}</p>
            <p className="mt-2 text-xs opacity-50">{new Date(n.createdAt).toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}