import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClientConfigLoader } from '../components/ClientConfigLoader';
import { ClientConfigProvider } from '../hooks/useClientConfig';
import { ConfigConfigError, ConfigConfigLoading } from './ConfigConfig';
import { FeatureCheck } from './FeatureCheck';
import { createRouter } from './Router';
import { ScreenSizeProvider, useScreenSize } from '../hooks/useScreenSize';

const queryClient = new QueryClient();

function App() {
  const screenSize = useScreenSize();
  
  // Temporary debug render
  if (window.location.search.includes('debug')) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0', color: '#000' }}>
        <h1>Cinny Debug Mode</h1>
        <p>React is working!</p>
        <p>Screen size: {JSON.stringify(screenSize)}</p>
      </div>
    );
  }
  
  return (
    <ScreenSizeProvider value={screenSize}>
      <FeatureCheck>
        <ClientConfigLoader
          fallback={() => <ConfigConfigLoading />}
          error={(err, retry, ignore) => (
            <ConfigConfigError error={err} retry={retry} ignore={ignore} />
          )}
        >
          {(clientConfig) => (
            <ClientConfigProvider value={clientConfig}>
              <QueryClientProvider client={queryClient}>
                <JotaiProvider>
                  <RouterProvider router={createRouter(clientConfig, screenSize)} />
                </JotaiProvider>
              </QueryClientProvider>
            </ClientConfigProvider>
          )}
        </ClientConfigLoader>
      </FeatureCheck>
    </ScreenSizeProvider>
  );
}

export default App;
