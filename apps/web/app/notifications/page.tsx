"use client";

import { useEffect, useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/layout/PageShell";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });
const PAGE_SIZE = 20;

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
  page: number;
  limit: number;
}

function authHeaders(): Record<string, string> | null {
  const token = localStorage.getItem("jrs_token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    const headers = authHeaders();
    if (!headers) {
      setError("Sign in first to see notifications.");
      return;
    }
    api
      .get<NotificationPage>("/api/v1/notifications", {
        headers,
        params: { page: 1, limit: PAGE_SIZE },
      })
      .then((res) => {
        setItems(res.data.items);
        setPage(res.data.page);
        setTotal(res.data.total);
      })
      .catch(() => setError("Could not load notifications. Your session may have expired."));
  }, []);

  async function loadMore() {
    const headers = authHeaders();
    if (!headers) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const res = await api.get<NotificationPage>(
        "/api/v1/notifications",
        { headers, params: { page: page + 1, limit: PAGE_SIZE } },
      );
      setItems((prev) => {
        const existingIds = new Set(prev?.map((item) => item.id) ?? []);
        const additions = res.data.items.filter((item) => !existingIds.has(item.id));
        return [...(prev ?? []), ...additions];
      });
      setPage(res.data.page);
      setTotal(res.data.total);
    } catch {
      setLoadMoreError("Could not load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  }

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
      {items !== null && page * PAGE_SIZE < total && (
        <div className="mt-4 flex items-center gap-3">
          <button
            className="jrs-btn jrs-btn-ghost text-sm"
            disabled={loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
          {loadMoreError && <p className="text-sm opacity-70">{loadMoreError}</p>}
        </div>
      )}
    </PageShell>
  );
}