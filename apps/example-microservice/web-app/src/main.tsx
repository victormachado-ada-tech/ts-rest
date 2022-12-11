import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { postsApi } from '@ts-rest/example-microservice/util-posts-api';
import { initQueryClient } from '@ts-rest/react-query';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

export const postsClient = initQueryClient(postsApi, {
  baseHeaders: {},
  baseUrl: 'http://localhost:5003',
});

export const queryClient = new QueryClient();

const Wrappers = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<Wrappers />);
