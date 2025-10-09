import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function BacktestingDashboard({ predictions, darkMode }) {
  const [timeRange, setTimeRange] = useState('all');

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (!predictions || predictions.length === 0) {
    return (
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Backtesting Dashboard</h3>
        </div>
        <p className={textSecondary}>
          Make some predictions to see historical performance analysis!
        </p>
      </div>
    );
  }

  // Filter predictions by time range
  const filterPredictions = () => {
    const now = new Date();
    return predictions.filter(p => {
      if (timeRange === 'all') return true;
      const predDate = new Date(p.date);
      const diffDays = Math.floor((now - predDate) / (1000 * 60 * 60 * 24));

      if (timeRange === '7d') return diffDays <= 7;
      if (timeRange === '30d') return diffDays <= 30;
      if (timeRange === '90d') return diffDays <= 90;
      return true;
    });
  };

  const filteredPredictions = filterPredictions();
  const resolvedPredictions = filteredPredictions.filter(p => p.actual !== null);

  // Calculate stats
  const totalPredictions = filteredPredictions.length;
  const correctPredictions = resolvedPredictions.filter(p => p.prediction === p.actual).length;
  const accuracy = resolvedPredictions.length > 0
    ? (correctPredictions / resolvedPredictions.length) * 100
    : 0;

  const upPredictions = filteredPredictions.filter(p => p.prediction === 'UP');
  const downPredictions = filteredPredictions.filter(p => p.prediction === 'DOWN');

  const upAccuracy = upPredictions.filter(p => p.actual === 'UP').length /
    upPredictions.filter(p => p.actual !== null).length * 100 || 0;
  const downAccuracy = downPredictions.filter(p => p.actual === 'DOWN').length /
    downPredictions.filter(p => p.actual !== null).length * 100 || 0;

  // Simulate P&L (assuming $100 per trade)
  const simulatedPL = resolvedPredictions.reduce((total, pred) => {
    if (pred.prediction === pred.actual) {
      return total + 100; // Win $100
    } else {
      return total - 100; // Lose $100
    }
  }, 0);

  // Generate cumulative P&L chart data
  const chartData = [];
  let cumulativePL = 0;
  resolvedPredictions.forEach((pred, index) => {
    if (pred.prediction === pred.actual) {
      cumulativePL += 100;
    } else {
      cumulativePL -= 100;
    }
    chartData.push({
      trade: index + 1,
      pl: cumulativePL,
      date: new Date(pred.date).toLocaleDateString()
    });
  });

  // Best and worst streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let worstStreak = 0;
  resolvedPredictions.forEach(pred => {
    if (pred.prediction === pred.actual) {
      currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      worstStreak = Math.min(worstStreak, currentStreak);
    }
  });

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Backtesting Dashboard</h3>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-orange-600 text-white'
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-orange-100`
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Total Trades</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{totalPredictions}</p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Accuracy</p>
          <p className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</p>
        </div>

        <div className={`p-4 rounded-lg ${simulatedPL >= 0 ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20'}`}>
          <p className={`text-sm ${textSecondary} mb-1`}>Simulated P&L</p>
          <p className={`text-2xl font-bold ${simulatedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(simulatedPL)}
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Win Rate</p>
          <p className="text-2xl font-bold text-purple-600">
            {resolvedPredictions.length > 0 ? ((correctPredictions / resolvedPredictions.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* Direction-specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <p className={`font-semibold ${textPrimary}`}>UP Predictions</p>
          </div>
          <p className={textSecondary}>
            Total: {upPredictions.length} | Accuracy: {upAccuracy.toFixed(1)}%
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <p className={`font-semibold ${textPrimary}`}>DOWN Predictions</p>
          </div>
          <p className={textSecondary}>
            Total: {downPredictions.length} | Accuracy: {downAccuracy.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Best Winning Streak</p>
          <p className={`text-xl font-bold ${textPrimary}`}>{bestStreak} trades</p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Worst Losing Streak</p>
          <p className={`text-xl font-bold ${textPrimary}`}>{Math.abs(worstStreak)} trades</p>
        </div>
      </div>

      {/* Cumulative P&L Chart */}
      {chartData.length > 0 && (
        <div>
          <h4 className={`font-semibold ${textPrimary} mb-3`}>Cumulative P&L Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="trade"
                tick={{ fontSize: 12 }}
                label={{ value: 'Trade Number', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{ value: 'P&L ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: darkMode ? '#374151' : 'white', border: '1px solid #ccc' }}
                formatter={(value) => [`$${value}`, 'P&L']}
              />
              <Line
                type="monotone"
                dataKey="pl"
                stroke={simulatedPL >= 0 ? '#10B981' : '#EF4444'}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Note */}
      <div className={`mt-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
        <p className={`text-xs ${textSecondary}`}>
          <strong>Note:</strong> Simulated P&L assumes $100 profit per correct prediction and $100 loss per incorrect prediction.
          Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}

export default BacktestingDashboard;
