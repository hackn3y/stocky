import React from 'react';

// Pulse animation for skeletons
const pulseClass = "animate-pulse bg-gray-200 dark:bg-gray-700";

// Prediction Cards Skeleton
export function PredictionSkeleton({ darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <div className={`h-8 ${pulseClass} rounded w-1/3 mb-6`}></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`p-6 ${pulseClass} rounded-lg h-40`}>
            <div className={`h-4 ${pulseClass} rounded w-1/3 mb-4`}></div>
            <div className={`h-10 ${pulseClass} rounded w-2/3 mb-2`}></div>
            <div className={`h-3 ${pulseClass} rounded w-1/2`}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ darkMode, height = 400 }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex justify-between items-center mb-6">
        <div className={`h-6 ${pulseClass} rounded w-1/4`}></div>
        <div className="flex gap-2">
          <div className={`h-8 w-24 ${pulseClass} rounded`}></div>
          <div className={`h-8 w-24 ${pulseClass} rounded`}></div>
        </div>
      </div>
      <div className={`${pulseClass} rounded`} style={{ height: `${height}px` }}></div>
    </div>
  );
}

// Watchlist Skeleton
export function WatchlistSkeleton({ darkMode, count = 3 }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <div className={`h-6 ${pulseClass} rounded w-1/4 mb-4`}></div>
      <div className="flex flex-wrap gap-2">
        {[...Array(count)].map((_, i) => (
          <div key={i} className={`${pulseClass} rounded-full h-10 w-24`}></div>
        ))}
      </div>
    </div>
  );
}

// News Skeleton
export function NewsSkeleton({ darkMode, count = 5 }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <div className={`h-6 ${pulseClass} rounded w-1/4 mb-4`}></div>
      <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className={`${pulseClass} rounded w-24 h-20 flex-shrink-0`}></div>
            <div className="flex-1">
              <div className={`h-4 ${pulseClass} rounded w-full mb-2`}></div>
              <div className={`h-4 ${pulseClass} rounded w-3/4 mb-2`}></div>
              <div className={`h-3 ${pulseClass} rounded w-1/2`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Table Skeleton (for portfolio, predictions, etc.)
export function TableSkeleton({ darkMode, rows = 5, columns = 4 }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <div className={`h-6 ${pulseClass} rounded w-1/4 mb-4`}></div>
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4">
            {[...Array(columns)].map((_, j) => (
              <div key={j} className={`h-10 ${pulseClass} rounded flex-1`}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Card Skeleton (generic)
export function CardSkeleton({ darkMode, height = 'auto' }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`} style={{ height }}>
      <div className={`h-6 ${pulseClass} rounded w-1/3 mb-4`}></div>
      <div className="space-y-3">
        <div className={`h-4 ${pulseClass} rounded w-full`}></div>
        <div className={`h-4 ${pulseClass} rounded w-5/6`}></div>
        <div className={`h-4 ${pulseClass} rounded w-4/6`}></div>
      </div>
    </div>
  );
}

// Stats Grid Skeleton
export function StatsGridSkeleton({ darkMode, count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`p-4 ${pulseClass} rounded-lg h-24`}>
          <div className={`h-3 ${pulseClass} rounded w-2/3 mb-2`}></div>
          <div className={`h-8 ${pulseClass} rounded w-full`}></div>
        </div>
      ))}
    </div>
  );
}

// Inline Loading Spinner
export function LoadingSpinner({ size = 'md', color = 'indigo' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  const colors = {
    indigo: 'border-indigo-600 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}></div>
  );
}

// Full Page Loading
export function FullPageLoading({ darkMode, message = 'Loading...' }) {
  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} flex flex-col items-center justify-center z-50`}>
      <LoadingSpinner size="lg" color="indigo" />
      <p className={`mt-4 text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {message}
      </p>
    </div>
  );
}
