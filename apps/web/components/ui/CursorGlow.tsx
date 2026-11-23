"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    function move(e: MouseEvent) {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
      }
    }
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[300px] w-[300px] rounded-full opacity-30 blur-3xl"
      style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
    />
  );
}