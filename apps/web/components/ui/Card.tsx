import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  delayMs?: number;
}

export function Card({ title, children, delayMs = 0 }: CardProps) {
  return (
    <section
      className="jrs-rise rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <h2 className="mb-4 text-lg font-semibold text-[var(--accent)]">{title}</h2>
      {children}
    </section>
  );
}