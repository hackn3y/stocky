import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

// Error Display Component with Retry
export function ErrorDisplay({ error, onRetry, onGoHome, darkMode, context = 'loading data' }) {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-8 mb-6 text-center`}>
      <div className="flex flex-col items-center">
        <div className="p-4 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>

        <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>
          Oops! Something went wrong
        </h3>

        <p className={`${textSecondary} mb-4 max-w-md`}>
          We encountered an error while {context}.
          {error && (
            <span className="block mt-2 text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {error}
            </span>
          )}
        </p>

        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          )}
        </div>

        <div className={`mt-6 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg max-w-md`}>
          <p className={`text-sm ${textSecondary}`}>
            <strong>Troubleshooting tips:</strong>
          </p>
          <ul className={`text-sm ${textSecondary} text-left mt-2 space-y-1`}>
            <li>• Check your internet connection</li>
            <li>• The API might be temporarily unavailable</li>
            <li>• Try refreshing the page (Ctrl/Cmd + R)</li>
            <li>• Clear your browser cache and cookies</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Inline Error Component (smaller, for sections)
export function InlineError({ message, onRetry, darkMode }) {
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-800 rounded-lg">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <p className={`text-sm ${textSecondary} flex-1`}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
}

// Network Status Component
export function NetworkStatus({ isOnline }) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-[100]">
      <AlertCircle className="inline h-4 w-4 mr-2" />
      You are currently offline. Some features may not work.
    </div>
  );
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Retry wrapper for async functions
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}
