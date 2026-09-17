"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/api/errors";

/**
 * TanStack Query owns server state (docs/architecture/FRONTEND.md §3).
 * A client boundary around children only: it reads no cookies, so ISR pages stay static.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per browser session (and per request during SSR), never shared across users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            // Retry once for network/5xx failures; a 4xx will not succeed on a second try
            retry: (failureCount, error) =>
              failureCount < 1 && !(error instanceof ApiError && error.status < 500),
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
