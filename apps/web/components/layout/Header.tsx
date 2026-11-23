import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--surface-border)] bg-[var(--surface)]/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-[var(--accent)]">
          JRSphere
        </Link>
        <div className="flex gap-4 text-sm opacity-80">
          <Link href="/identity-test" className="transition hover:opacity-100">
            Identity
          </Link>
        </div>
      </nav>
    </header>
  );
}