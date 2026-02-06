"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProgressProvider } from '@bprogress/next/app';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ProgressProvider 
          height="4px"
          color="#e11d48"
          options={{ showSpinner: false }}
          shallowRouting
        >
          {children}
        </ProgressProvider>
    </QueryClientProvider>
  );
}
