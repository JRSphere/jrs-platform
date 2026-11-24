"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(localStorage.getItem("jrs_token")));
  }, []);

  function signOut() {
    localStorage.removeItem("jrs_token");
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
          <Link href="/notifications" className="text-[var(--foreground)] opacity-80 no-underline hover:opacity-100">
            Notifications
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