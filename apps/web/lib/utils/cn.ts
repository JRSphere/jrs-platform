import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combines class values and resolves conflicting Tailwind classes. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
