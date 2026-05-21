'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Evita recargas innecesarias al cambiar de pestaña
            retry: 1,                    // Intenta una sola vez en caso de fallo
            staleTime: 2 * 60 * 1000,    // 2 minutos de caché en caliente
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
