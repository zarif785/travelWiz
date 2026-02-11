import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, TripProvider, TripProfileProvider } from '@/context';
import { AppRouter } from '@/routes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TripProvider>
          <TripProfileProvider>
            <AppRouter />
          </TripProfileProvider>
        </TripProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
