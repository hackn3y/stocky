import React from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

function ComparisonView({
  comparisonData,
  comparisonSymbols,
  onClose,
  onRemoveSymbol,
  onAddSymbol,
  darkMode
}) {
  const [newSymbol, setNewSymbol] = React.useState('');

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-600' : 'border-gray-300';

  const handleAddSymbol = (e) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      onAddSymbol(newSymbol.toUpperCase());
      setNewSymbol('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${cardBg} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Compare Stocks</h2>
            <button
              onClick={onClose}
              className={`${textSecondary} hover:${textPrimary} text-2xl font-bold`}
            >
              ×
            </button>
          </div>

          {/* Add Symbol Form */}
          <form onSubmit={handleAddSymbol} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="Add symbol (max 5)"
                className={`flex-1 px-4 py-2 ${inputBg} border ${borderColor} rounded-lg ${textPrimary}`}
                maxLength={10}
                disabled={comparisonSymbols.length >= 5}
              />
              <button
                type="submit"
                disabled={!newSymbol.trim() || comparisonSymbols.length >= 5}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                Add
              </button>
            </div>
            {comparisonSymbols.length >= 5 && (
              <p className="text-sm text-yellow-600 mt-1">Maximum 5 symbols allowed</p>
            )}
          </form>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${borderColor}`}>
                  <th className={`text-left py-3 px-4 ${textPrimary}`}>Symbol</th>
                  <th className={`text-left py-3 px-4 ${textPrimary}`}>Prediction</th>
                  <th className={`text-left py-3 px-4 ${textPrimary}`}>Confidence</th>
                  <th className={`text-left py-3 px-4 ${textPrimary}`}>Price</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((stock) => (
                  <tr key={stock.symbol} className={`border-b ${borderColor}`}>
                    <td className={`py-3 px-4 font-bold ${textPrimary}`}>{stock.symbol}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {stock.prediction === 'UP' ? (
                          <>
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-600">UP</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <span className="font-semibold text-red-600">DOWN</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      {stock.confidence.toFixed(1)}%
                    </td>
                    <td className={`py-3 px-4 ${textPrimary}`}>
                      ${stock.current_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onRemoveSymbol(stock.symbol)}
                        className={`${textSecondary} hover:text-red-600`}
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comparisonData.length === 0 && (
            <div className={`text-center py-8 ${textSecondary}`}>
              <p>Loading comparison data...</p>
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonView;
