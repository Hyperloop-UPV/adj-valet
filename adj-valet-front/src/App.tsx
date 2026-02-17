import { useState, useEffect } from 'react';
import { Content } from './layout/Content';
import { Sidebar } from './layout/Sidebar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useADJState, useADJActions } from './store/ADJStore';
import { AppTopBar } from './components/AppTopBar';
import { SetupScreen } from './components/SetupScreen';

function App() {
  const { isLoading, error, adjPath, config } = useADJState();
  const { loadConfig, setError, resetState, loadDemoConfig } = useADJActions();
  const [selectedSection, setSelectedSection] = useState('general_info');
  const [pathInput, setPathInput] = useState('');
  const demoMode =
    new URLSearchParams(window.location.search).get('demo') === '1' ||
    localStorage.getItem('adj_demo') === 'true';

  // Debug logging
  useEffect(() => {
    console.log('App state:', { isLoading, error, adjPath: adjPath || 'null', hasConfig: !!config });
  }, [isLoading, error, adjPath, config]);

  const handleLoadConfig = async () => {
    if (!pathInput.trim()) {
      setError('Please enter a valid ADJ path');
      return;
    }
    
    await loadConfig(pathInput.trim());
  };

  useEffect(() => {
    if (demoMode && !config) {
      loadDemoConfig();
      return;
    }
    if (!config && !isLoading && !error) {
      console.log('Attempting to load config on mount');
      loadConfig().catch((error) => {
        console.error('Failed to load config:', error);
      });
    }
  }, []); // Only run on mount

  const shouldShowSetup = !adjPath || (error && !config);

  if (shouldShowSetup) {
    return (
      <SetupScreen
        adjPath={adjPath}
        error={error}
        isLoading={isLoading}
        pathInput={pathInput}
        setPathInput={setPathInput}
        onLoadConfig={handleLoadConfig}
        onReset={() => {
          resetState();
          setPathInput('');
        }}
        onLoadDemo={loadDemoConfig}
      />
    );
  }

  if (isLoading && !config) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-gray-600">Loading ADJ configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Configuration Loaded</h2>
          <p className="text-gray-600">Failed to load the ADJ configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar
        selectedSection={selectedSection}
        onSelectedSection={setSelectedSection}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar />
        <Content
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
        />
      </div>

      {isLoading && (
        <div className="fixed right-6 top-6 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner />
            Saving changes...
          </div>
        </div>
      )}

      {error && (
        <div className="fixed right-6 top-20 max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
