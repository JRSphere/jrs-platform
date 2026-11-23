import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  delayMs?: number;
}

export function Card({ title, children, delayMs = 0 }: CardProps) {
  return (
    <section
      className="jrs-rise jrs-card p-6"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <h2 className="mb-4 text-lg font-semibold text-[var(--accent)]">{title}</h2>
      {children}
    </section>
  );
}