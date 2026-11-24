"use client";

import Link from "next/link";
import { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { TiltCard } from "@/components/ui/TiltCard";
import { PageShell } from "@/components/layout/PageShell";

const features = [
  { title: "Projects", text: "Plan work, assign tasks, and track progress in one place." },
  { title: "Tasks", text: "Create, assign, and move tasks through clear status stages." },
  { title: "Notifications", text: "Know when something is assigned to you, the moment it happens." },
];

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);

  function onMove(e: React.MouseEvent<HTMLElement>) {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <PageShell>
      <section
        ref={heroRef}
        onMouseMove={onMove}
        className="jrs-card relative overflow-hidden p-10 text-center sm:p-16"
        style={{
          backgroundImage:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgba(129,140,248,0.28), transparent 60%)",
        }}
      >
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
          JRSphere Office Platform
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Run your whole office
          <span className="block text-[var(--accent)]">from one calm place.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg opacity-70">
          Projects, tasks, and team notifications, built to be fast, clear, and easy to use.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/projects" className="jrs-btn no-underline">Get started</Link>
          <Link href="/identity-test" className="jrs-btn jrs-btn-ghost no-underline">Sign in</Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {features.map((f, i) => (
          <TiltCard key={f.title}>
            <Card title={f.title} delayMs={i * 120}>
              <p className="text-sm opacity-70">{f.text}</p>
            </Card>
          </TiltCard>
        ))}
      </section>
    </PageShell>
  );
}