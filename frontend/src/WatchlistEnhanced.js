import React, { useState } from 'react';
import { Star, X, ArrowUpDown, Trash2, RefreshCw, Download } from 'lucide-react';

function WatchlistEnhanced({ watchlist, onRemove, onSelect, darkMode, onBulkRefresh }) {
  const [sortBy, setSortBy] = useState('alphabetical'); // alphabetical, recent
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (watchlist.length === 0) {
    return null;
  }

  // Sort watchlist
  const sortedWatchlist = [...watchlist].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.localeCompare(b);
    }
    return 0; // Recent is default order
  });

  // Toggle selection
  const toggleSelect = (ticker) => {
    if (selected.includes(ticker)) {
      setSelected(selected.filter(t => t !== ticker));
    } else {
      setSelected([...selected, ticker]);
    }
  };

  // Select all
  const selectAll = () => {
    setSelected([...watchlist]);
  };

  // Deselect all
  const deselectAll = () => {
    setSelected([]);
  };

  // Bulk delete
  const bulkDelete = () => {
    selected.forEach(ticker => onRemove(ticker));
    setSelected([]);
    setSelectMode(false);
  };

  // Export watchlist
  const exportWatchlist = () => {
    const csv = 'Symbol\n' + watchlist.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watchlist.csv';
    a.click();
  };

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-4 mb-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" fill="currentColor" />
          <h3 className={`font-semibold ${textPrimary}`}>Watchlist</h3>
          <span className={`text-sm ${textSecondary}`}>({watchlist.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Button */}
          <button
            onClick={() => setSortBy(sortBy === 'alphabetical' ? 'recent' : 'alphabetical')}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            title={`Sort: ${sortBy === 'alphabetical' ? 'A-Z' : 'Recent'}`}
          >
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
          </button>

          {/* Bulk Actions Button */}
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelected([]);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectMode
                ? 'bg-indigo-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>

          {/* Export Button */}
          <button
            onClick={exportWatchlist}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
            title="Export to CSV"
          >
            <Download className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectMode && (
        <div className={`mb-3 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${textSecondary}`}>
              {selected.length} selected
            </span>
            <button
              onClick={selectAll}
              className="text-sm text-indigo-600 hover:underline"
            >
              Select All
            </button>
            {selected.length > 0 && (
              <button
                onClick={deselectAll}
                className="text-sm text-indigo-600 hover:underline"
              >
                Deselect All
              </button>
            )}
          </div>

          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              {onBulkRefresh && (
                <button
                  onClick={() => {
                    onBulkRefresh(selected);
                    setSelectMode(false);
                    setSelected([]);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${selected.length} stocks from watchlist?`)) {
                    bulkDelete();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Watchlist Items */}
      <div className="flex flex-wrap gap-2">
        {sortedWatchlist.map((ticker) => (
          <div
            key={ticker}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg group transition-all ${
              selectMode
                ? selected.includes(ticker)
                  ? 'bg-indigo-600 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-200 text-gray-700'
                : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
            } ${selectMode ? 'cursor-pointer' : ''}`}
            onClick={() => selectMode && toggleSelect(ticker)}
          >
            {selectMode ? (
              <span className="font-semibold">{ticker}</span>
            ) : (
              <>
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
              </>
            )}
          </div>
        ))}
      </div>

      {/* Tip */}
      {!selectMode && (
        <p className={`text-xs ${textSecondary} mt-3`}>
          Tip: Click a symbol to view prediction, or use Select mode for bulk actions
        </p>
      )}
    </div>
  );
}

export default WatchlistEnhanced;
