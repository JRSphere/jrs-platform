import { QueryClient } from "@tanstack/react-query";

/** Creates a QueryClient with the app's default query options. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
