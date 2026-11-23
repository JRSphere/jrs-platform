import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TiltCard } from "@/components/ui/TiltCard";
import { CursorGlow } from "@/components/ui/CursorGlow";

const features = [
  { title: "Projects", text: "Plan work, assign tasks, and track progress in one place." },
  { title: "Tasks", text: "Create, assign, and move tasks through clear status stages." },
  { title: "Notifications", text: "Know when something is assigned to you, the moment it happens." },
];

export default function HomePage() {
  return (
    <main className="relative mx-auto max-w-5xl space-y-16 px-6 py-20">
      <CursorGlow />

      <section className="jrs-rise space-y-6 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
          JRSphere Office Platform
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Run your whole office
          <span className="block text-[var(--accent)]">from one calm place.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg opacity-70">
          Projects, tasks, and team notifications, built to be fast, clear, and easy to use.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/identity-test" className="jrs-btn">Get started</Link>
          <Link href="/identity-test" className="jrs-btn jrs-btn-ghost">Sign in</Link>
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
    </main>
  );
}