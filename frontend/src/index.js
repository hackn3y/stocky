import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { AuthProvider } from './AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker to clear old caches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Unregister any existing service workers first
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        console.log('Unregistering old service worker...');
        registration.unregister();
      });
    });

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          console.log('Deleting cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }

    // Register the new cache-clearing service worker
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Cache-clearing SW registered:', registration);
        // Force update
        registration.update();
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
