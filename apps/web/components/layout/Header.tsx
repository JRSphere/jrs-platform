"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createHttpClient } from "@/lib/api-client/http-client";
import { env } from "@/lib/config/env";

const api = createHttpClient({ baseURL: env.NEXT_PUBLIC_API_BASE_URL });

export function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setSignedIn(Boolean(localStorage.getItem("jrs_token")));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchUnreadCount() {
      const token = localStorage.getItem("jrs_token");
      if (!signedIn || !token) {
        if (mounted) setUnreadCount(0);
        return;
      }
      try {
        const res = await api.get<{ count: number }>(
          "/api/v1/notifications/unread-count",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (mounted) setUnreadCount(res.data.count);
      } catch {
        if (mounted) setUnreadCount(0);
      }
    }

    void fetchUnreadCount();
    window.addEventListener("jrs:notifications-changed", fetchUnreadCount);
    return () => {
      mounted = false;
      window.removeEventListener("jrs:notifications-changed", fetchUnreadCount);
    };
  }, [signedIn]);

  function signOut() {
    localStorage.removeItem("jrs_token");
    setSignedIn(false);
    setUnreadCount(0);
    window.location.href = "/identity-test";
  }

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--surface-border)] bg-[var(--surface)]/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-[var(--accent)] no-underline">
          JRSphere
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/projects" className="text-[var(--foreground)] opacity-80 no-underline hover:opacity-100">
            Projects
          </Link>
          <Link href="/notifications" className="flex items-center gap-1.5 text-[var(--foreground)] opacity-80 no-underline hover:opacity-100">
            Notifications
            {signedIn && unreadCount > 0 && (
              <span
                className="rounded-full bg-[var(--accent)] px-1.5 text-xs text-white"
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          {signedIn ? (
            <button onClick={signOut} className="jrs-btn jrs-btn-ghost text-sm">
              Sign out
            </button>
          ) : (
            <Link href="/identity-test" className="jrs-btn text-sm no-underline">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}