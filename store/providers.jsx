'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import store from './store';
import ValidateToken from '@/components/ValidateToken';
import ValidateAdminToken from '@/components/ValidateAdminToken';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,  // 2 minutes before data is considered stale
      retry: 1,                   // Retry failed requests once
    },
  },
});

export function Providers({ children }) {
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
