import React from 'react';
import { Star, X } from 'lucide-react';

function Watchlist({ watchlist, onRemove, onSelect, darkMode }) {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (watchlist.length === 0) {
    return null;
  }

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-4 mb-6`}>
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
        <h3 className={`font-semibold ${textPrimary}`}>Watchlist</h3>
        <span className={`text-sm ${textSecondary}`}>({watchlist.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {watchlist.map((ticker) => (
          <div
            key={ticker}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg group"
          >
            <button
              onClick={() => onSelect(ticker)}
              className="font-semibold hover:underline"
            >
              {ticker}
            </button>
            <button
              onClick={() => onRemove(ticker)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove from watchlist"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Watchlist;
