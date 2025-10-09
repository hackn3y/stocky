import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, X, DollarSign } from 'lucide-react';
import { calculatePortfolioStats } from './utils';

function Portfolio({ portfolio, onAdd, onRemove, onUpdate, darkMode }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: '', shares: '', purchasePrice: '' });

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-600' : 'border-gray-300';

  const stats = calculatePortfolioStats(portfolio);

  const handleAdd = (e) => {
    e.preventDefault();
    if (newStock.symbol && newStock.shares && newStock.purchasePrice) {
      onAdd({
        symbol: newStock.symbol.toUpperCase(),
        shares: parseFloat(newStock.shares),
        purchasePrice: parseFloat(newStock.purchasePrice),
        currentPrice: parseFloat(newStock.purchasePrice), // Will be updated by parent
        addedDate: new Date().toISOString()
      });
      setNewStock({ symbol: '', shares: '', purchasePrice: '' });
      setShowAdd(false);
    }
  };

  if (portfolio.length === 0 && !showAdd) {
    return (
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <h3 className={`text-xl font-bold ${textPrimary}`}>Portfolio</h3>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Stock
          </button>
        </div>
        <p className={`${textSecondary} text-center py-8`}>
          No stocks in portfolio. Add stocks to track your performance!
        </p>
      </div>
    );
  }

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Portfolio</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Add Stock
        </button>
      </div>

      {/* Add Stock Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className={`mb-6 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Symbol"
              value={newStock.symbol}
              onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
              className={`px-3 py-2 ${inputBg} border ${borderColor} rounded ${textPrimary}`}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Shares"
              value={newStock.shares}
              onChange={(e) => setNewStock({ ...newStock, shares: e.target.value })}
              className={`px-3 py-2 ${inputBg} border ${borderColor} rounded ${textPrimary}`}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Purchase Price"
              value={newStock.purchasePrice}
              onChange={(e) => setNewStock({ ...newStock, purchasePrice: e.target.value })}
              className={`px-3 py-2 ${inputBg} border ${borderColor} rounded ${textPrimary}`}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className={`text-sm ${textSecondary}`}>Total Value</p>
          <p className={`text-xl font-bold ${textPrimary}`}>${stats.totalValue.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className={`text-sm ${textSecondary}`}>Total Cost</p>
          <p className={`text-xl font-bold ${textPrimary}`}>${stats.totalCost.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className={`text-sm ${textSecondary}`}>Total P/L</p>
          <p className={`text-xl font-bold ${stats.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(stats.totalPL).toFixed(2)}
            {stats.totalPL >= 0 ? <TrendingUp className="inline h-4 w-4 ml-1" /> : <TrendingDown className="inline h-4 w-4 ml-1" />}
          </p>
        </div>
        <div className="text-center">
          <p className={`text-sm ${textSecondary}`}>Return %</p>
          <p className={`text-xl font-bold ${stats.totalPLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.totalPLPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${borderColor}`}>
              <th className={`text-left py-2 px-2 ${textPrimary}`}>Symbol</th>
              <th className={`text-right py-2 px-2 ${textPrimary}`}>Shares</th>
              <th className={`text-right py-2 px-2 ${textPrimary}`}>Avg Cost</th>
              <th className={`text-right py-2 px-2 ${textPrimary}`}>Current</th>
              <th className={`text-right py-2 px-2 ${textPrimary}`}>P/L</th>
              <th className="py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((stock, index) => {
              const pl = (stock.currentPrice - stock.purchasePrice) * stock.shares;
              const plPercent = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100;
              return (
                <tr key={index} className={`border-b ${borderColor}`}>
                  <td className={`py-2 px-2 font-bold ${textPrimary}`}>{stock.symbol}</td>
                  <td className={`py-2 px-2 text-right ${textPrimary}`}>{stock.shares}</td>
                  <td className={`py-2 px-2 text-right ${textPrimary}`}>${stock.purchasePrice.toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right ${textPrimary}`}>${stock.currentPrice.toFixed(2)}</td>
                  <td className={`py-2 px-2 text-right font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(pl).toFixed(2)} ({plPercent.toFixed(2)}%)
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => onRemove(index)}
                      className={`${textSecondary} hover:text-red-600`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Portfolio;
