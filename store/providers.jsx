'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import store from './store';
import ValidateToken from '@/components/ValidateToken';
import ValidateAdminToken from '@/components/ValidateAdminToken';

import { useState } from 'react';

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2,  // 2 minutes before data is considered stale
        retry: 1,                   // Retry failed requests once
      },
    },
  });

export function Providers({ children }) {
  // One cache per browser session / per server request. A module-level client would be shared
  // by every server render, so one visitor's cached data (and stale counts) leaked into the next
  // visitor's page and server-passed initialData was ignored.
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <Provider store={store}>
          <ValidateToken />
          <ValidateAdminToken />
          {children}
        </Provider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
