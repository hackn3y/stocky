import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, X, AlertCircle, Trophy, BarChart2 } from 'lucide-react';
import { useAuth } from './AuthContext';

function PaperTrading({ darkMode, currentSymbol, currentPrice, prediction }) {
  const { user, updateUser, isAuthenticated } = useAuth();

  // State
  const [balance, setBalance] = useState(() => {
    if (isAuthenticated && user?.paperTrading) {
      return user.paperTrading.balance;
    }
    const stored = localStorage.getItem('paperTrading_balance');
    return stored ? parseFloat(stored) : 10000;
  });

  const [positions, setPositions] = useState(() => {
    if (isAuthenticated && user?.paperTrading) {
      return user.paperTrading.positions || [];
    }
    const stored = localStorage.getItem('paperTrading_positions');
    return stored ? JSON.parse(stored) : [];
  });

  const [trades, setTrades] = useState(() => {
    if (isAuthenticated && user?.paperTrading) {
      return user.paperTrading.trades || [];
    }
    const stored = localStorage.getItem('paperTrading_trades');
    return stored ? JSON.parse(stored) : [];
  });

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const [tradeShares, setTradeShares] = useState('');
  const [error, setError] = useState('');

  // Theme classes
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';

  // Commission fee
  const COMMISSION = 1.00;

  // Save to storage
  useEffect(() => {
    if (isAuthenticated && updateUser) {
      updateUser({
        paperTrading: { balance, positions, trades }
      });
    } else {
      localStorage.setItem('paperTrading_balance', balance);
      localStorage.setItem('paperTrading_positions', JSON.stringify(positions));
      localStorage.setItem('paperTrading_trades', JSON.stringify(trades));
    }
  }, [balance, positions, trades, isAuthenticated, updateUser]);

  // Calculate portfolio value
  const getPortfolioValue = () => {
    // For demo: estimate position values (in real app, would fetch current prices)
    const positionsValue = positions.reduce((sum, pos) => {
      return sum + (pos.currentPrice || pos.buyPrice) * pos.shares;
    }, 0);
    return balance + positionsValue;
  };

  // Calculate total P&L
  const getTotalPL = () => {
    const portfolioValue = getPortfolioValue();
    return portfolioValue - 10000; // Starting balance was $10,000
  };

  // Calculate position P&L
  const getPositionPL = (position) => {
    const currentValue = (position.currentPrice || position.buyPrice) * position.shares;
    const costBasis = position.buyPrice * position.shares + position.commission;
    return currentValue - costBasis;
  };

  // Execute buy order
  const executeBuy = () => {
    setError('');
    const shares = parseInt(tradeShares);

    if (!shares || shares <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    if (!currentPrice) {
      setError('Current price not available');
      return;
    }

    const totalCost = (currentPrice * shares) + COMMISSION;

    if (totalCost > balance) {
      setError(`Insufficient funds. Need $${totalCost.toFixed(2)}, have $${balance.toFixed(2)}`);
      return;
    }

    // Check if we already have this position
    const existingPosition = positions.find(p => p.symbol === currentSymbol);

    if (existingPosition) {
      // Add to existing position (average up)
      const totalShares = existingPosition.shares + shares;
      const totalCost = (existingPosition.buyPrice * existingPosition.shares) + (currentPrice * shares);
      const avgPrice = totalCost / totalShares;

      setPositions(positions.map(p =>
        p.symbol === currentSymbol
          ? { ...p, shares: totalShares, buyPrice: avgPrice, commission: p.commission + COMMISSION }
          : p
      ));
    } else {
      // Create new position
      setPositions([...positions, {
        symbol: currentSymbol,
        shares: shares,
        buyPrice: currentPrice,
        currentPrice: currentPrice,
        commission: COMMISSION,
        openDate: new Date().toISOString(),
        prediction: prediction?.prediction || 'N/A'
      }]);
    }

    // Record trade
    setTrades([{
      type: 'BUY',
      symbol: currentSymbol,
      shares: shares,
      price: currentPrice,
      commission: COMMISSION,
      total: totalCost,
      date: new Date().toISOString(),
      prediction: prediction?.prediction || 'N/A'
    }, ...trades]);

    // Update balance
    setBalance(balance - totalCost);
    setShowTradeModal(false);
    setTradeShares('');
  };

  // Execute sell order
  const executeSell = (position) => {
    setError('');
    const shares = parseInt(tradeShares);

    if (!shares || shares <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    if (shares > position.shares) {
      setError(`You only own ${position.shares} shares`);
      return;
    }

    const sellPrice = position.currentPrice || position.buyPrice;
    const totalProceeds = (sellPrice * shares) - COMMISSION;

    // Record trade
    const trade = {
      type: 'SELL',
      symbol: position.symbol,
      shares: shares,
      price: sellPrice,
      commission: COMMISSION,
      total: totalProceeds,
      date: new Date().toISOString(),
      buyPrice: position.buyPrice,
      profitLoss: (sellPrice - position.buyPrice) * shares - COMMISSION
    };

    setTrades([trade, ...trades]);

    // Update position
    if (shares === position.shares) {
      // Close entire position
      setPositions(positions.filter(p => p.symbol !== position.symbol));
    } else {
      // Partial sell
      setPositions(positions.map(p =>
        p.symbol === position.symbol
          ? { ...p, shares: p.shares - shares }
          : p
      ));
    }

    // Update balance
    setBalance(balance + totalProceeds);
    setShowTradeModal(false);
    setTradeShares('');
  };

  // Reset account
  const resetAccount = () => {
    if (window.confirm('Are you sure you want to reset your paper trading account? This will set your balance back to $10,000 and clear all positions and trades.')) {
      setBalance(10000);
      setPositions([]);
      setTrades([]);
    }
  };

  const portfolioValue = getPortfolioValue();
  const totalPL = getTotalPL();
  const totalPLPercent = (totalPL / 10000) * 100;

  // Calculate win rate
  const closedTrades = trades.filter(t => t.type === 'SELL');
  const profitableTrades = closedTrades.filter(t => t.profitLoss > 0);
  const winRate = closedTrades.length > 0 ? (profitableTrades.length / closedTrades.length) * 100 : 0;

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Paper Trading Simulator</h3>
        </div>
        <button
          onClick={resetAccount}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Reset Account
        </button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Cash Balance</p>
          <p className={`text-2xl font-bold text-green-600`}>${balance.toFixed(2)}</p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Portfolio Value</p>
          <p className={`text-2xl font-bold text-blue-600`}>${portfolioValue.toFixed(2)}</p>
        </div>

        <div className={`p-4 rounded-lg ${totalPL >= 0 ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20'}`}>
          <p className={`text-sm ${textSecondary} mb-1`}>Total P&L</p>
          <p className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
            <span className="text-sm ml-1">({totalPLPercent >= 0 ? '+' : ''}{totalPLPercent.toFixed(1)}%)</span>
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Win Rate</p>
          <p className={`text-2xl font-bold text-purple-600`}>
            {winRate.toFixed(0)}%
            <span className="text-sm ml-1">({profitableTrades.length}/{closedTrades.length})</span>
          </p>
        </div>
      </div>

      {/* Quick Trade Button */}
      {currentSymbol && currentPrice && (
        <div className={`mb-6 p-4 border-2 ${borderColor} rounded-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold ${textPrimary}`}>{currentSymbol} - ${currentPrice.toFixed(2)}</p>
              {prediction && (
                <p className={`text-sm ${textSecondary}`}>
                  Prediction: <span className={prediction.prediction === 'UP' ? 'text-green-600' : 'text-red-600'}>
                    {prediction.prediction}
                  </span> ({prediction.confidence.toFixed(1)}%)
                </p>
              )}
            </div>
            <button
              onClick={() => { setTradeType('buy'); setShowTradeModal(true); setError(''); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Buy
            </button>
          </div>
        </div>
      )}

      {/* Positions */}
      {positions.length > 0 && (
        <div className="mb-6">
          <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
            <BarChart2 className="h-4 w-4" />
            Open Positions ({positions.length})
          </h4>
          <div className="space-y-2">
            {positions.map((pos, idx) => {
              const pl = getPositionPL(pos);
              const plPercent = (pl / (pos.buyPrice * pos.shares)) * 100;

              return (
                <div key={idx} className={`p-4 border ${borderColor} rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${textPrimary}`}>
                        {pos.symbol} - {pos.shares} shares @ ${pos.buyPrice.toFixed(2)}
                      </p>
                      <p className={`text-sm ${textSecondary}`}>
                        Current: ${(pos.currentPrice || pos.buyPrice).toFixed(2)} |
                        Value: ${((pos.currentPrice || pos.buyPrice) * pos.shares).toFixed(2)}
                      </p>
                      <p className={`text-sm font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        P&L: {pl >= 0 ? '+' : ''}${pl.toFixed(2)} ({plPercent >= 0 ? '+' : ''}{plPercent.toFixed(1)}%)
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setTradeType('sell');
                        setShowTradeModal(true);
                        setError('');
                        // Store which position we're selling
                        window.currentSellPosition = pos;
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div>
          <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
            <Trophy className="h-4 w-4" />
            Recent Trades (Last 10)
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.slice(0, 10).map((trade, idx) => (
              <div key={idx} className={`p-3 border ${borderColor} rounded-lg text-sm`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {trade.type === 'BUY' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-semibold ${textPrimary}`}>
                      {trade.type} {trade.symbol}
                    </span>
                  </div>
                  <span className={textSecondary}>
                    {new Date(trade.date).toLocaleString()}
                  </span>
                </div>
                <p className={textSecondary}>
                  {trade.shares} shares @ ${trade.price.toFixed(2)} = ${trade.total.toFixed(2)}
                  {trade.profitLoss !== undefined && (
                    <span className={`ml-2 font-semibold ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      P&L: {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${textPrimary}`}>
                {tradeType === 'buy' ? 'Buy' : 'Sell'} {tradeType === 'buy' ? currentSymbol : window.currentSellPosition?.symbol}
              </h3>
              <button
                onClick={() => { setShowTradeModal(false); setError(''); }}
                className={textSecondary}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
                  Number of Shares
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={tradeShares}
                  onChange={(e) => setTradeShares(e.target.value)}
                  className={`w-full px-4 py-2 border ${borderColor} rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="Enter number of shares (e.g., 10, 50, 100)"
                  autoFocus
                />

                {/* Quick select buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setTradeShares('1')}
                    className={`px-3 py-1 text-xs border ${borderColor} rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeShares('10')}
                    className={`px-3 py-1 text-xs border ${borderColor} rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}
                  >
                    10
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeShares('50')}
                    className={`px-3 py-1 text-xs border ${borderColor} rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}
                  >
                    50
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeShares('100')}
                    className={`px-3 py-1 text-xs border ${borderColor} rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}
                  >
                    100
                  </button>
                  {tradeType === 'buy' && currentPrice && (
                    <button
                      type="button"
                      onClick={() => {
                        const maxShares = Math.floor((balance - COMMISSION) / currentPrice);
                        setTradeShares(maxShares.toString());
                      }}
                      className={`px-3 py-1 text-xs border ${borderColor} rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}
                    >
                      Max
                    </button>
                  )}
                  {tradeType === 'sell' && window.currentSellPosition && (
                    <button
                      type="button"
                      onClick={() => setTradeShares(window.currentSellPosition.shares.toString())}
                      className={`px-3 py-1 text-xs border ${borderColor} rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}
                    >
                      All ({window.currentSellPosition.shares})
                    </button>
                  )}
                </div>
              </div>

              {tradeType === 'buy' && currentPrice && tradeShares && (
                <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg text-sm ${textPrimary}`}>
                  <p>Price per share: ${currentPrice.toFixed(2)}</p>
                  <p>Total cost: ${((currentPrice * parseInt(tradeShares || 0)) + COMMISSION).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Includes ${COMMISSION.toFixed(2)} commission</p>
                </div>
              )}

              {tradeType === 'sell' && window.currentSellPosition && tradeShares && (
                <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg text-sm ${textPrimary}`}>
                  <p>Price per share: ${(window.currentSellPosition.currentPrice || window.currentSellPosition.buyPrice).toFixed(2)}</p>
                  <p>Total proceeds: ${(((window.currentSellPosition.currentPrice || window.currentSellPosition.buyPrice) * parseInt(tradeShares || 0)) - COMMISSION).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">After ${COMMISSION.toFixed(2)} commission</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowTradeModal(false); setError(''); }}
                  className={`flex-1 px-4 py-2 border ${borderColor} rounded-lg ${textPrimary} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => tradeType === 'buy' ? executeBuy() : executeSell(window.currentSellPosition)}
                  className={`flex-1 px-4 py-2 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg`}
                >
                  Confirm {tradeType === 'buy' ? 'Buy' : 'Sell'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div className={`mt-6 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
        <p className={`text-xs ${textSecondary}`}>
          <strong>Note:</strong> This is a paper trading simulator with virtual money. Starting balance: $10,000.
          Commission: ${COMMISSION.toFixed(2)} per trade. Prices are based on latest data from predictions.
        </p>
      </div>
    </div>
  );
}

export default PaperTrading;
