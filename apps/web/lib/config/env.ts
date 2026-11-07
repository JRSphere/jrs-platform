import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.url(),
});

const result = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

if (!result.success) {
  const reason = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(reason);
}

export type Env = z.infer<typeof envSchema>;

/** Validated public environment variables. */
export const env: Readonly<Env> = Object.freeze(result.data);
