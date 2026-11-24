import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="jrs-rise relative mx-auto max-w-5xl space-y-10 px-6 py-16">
      {children}
    </main>
  );
}