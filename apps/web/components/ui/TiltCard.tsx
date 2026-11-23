"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";

export function TiltCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = "none";
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="transition-transform duration-200 will-change-transform">
      {children}
    </div>
  );
}