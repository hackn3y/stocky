import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Award, Target, AlertTriangle } from 'lucide-react';

function PerformanceAnalytics({ predictions, darkMode }) {
  const [timeRange, setTimeRange] = useState('all');

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (!predictions || predictions.length === 0) {
    return (
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-blue-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Performance Analytics</h3>
        </div>
        <p className={textSecondary}>
          Make some predictions to see performance analytics!
        </p>
      </div>
    );
  }

  // Filter by time range
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

  // Accuracy by symbol
  const symbolStats = {};
  resolvedPredictions.forEach(pred => {
    if (!symbolStats[pred.symbol]) {
      symbolStats[pred.symbol] = { total: 0, correct: 0 };
    }
    symbolStats[pred.symbol].total++;
    if (pred.prediction === pred.actual) {
      symbolStats[pred.symbol].correct++;
    }
  });

  const symbolData = Object.keys(symbolStats)
    .map(symbol => ({
      symbol,
      accuracy: (symbolStats[symbol].correct / symbolStats[symbol].total) * 100,
      total: symbolStats[symbol].total,
      correct: symbolStats[symbol].correct
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10);

  // Best and worst performers
  const bestPerformer = symbolData[0] || null;
  const worstPerformer = symbolData[symbolData.length - 1] || null;

  // Accuracy by confidence range
  const confidenceRanges = {
    '50-55%': { correct: 0, total: 0 },
    '55-60%': { correct: 0, total: 0 },
    '60-65%': { correct: 0, total: 0 },
    '65-70%': { correct: 0, total: 0 },
    '70%+': { correct: 0, total: 0 }
  };

  resolvedPredictions.forEach(pred => {
    let range;
    if (pred.confidence >= 70) range = '70%+';
    else if (pred.confidence >= 65) range = '65-70%';
    else if (pred.confidence >= 60) range = '60-65%';
    else if (pred.confidence >= 55) range = '55-60%';
    else range = '50-55%';

    confidenceRanges[range].total++;
    if (pred.prediction === pred.actual) {
      confidenceRanges[range].correct++;
    }
  });

  const confidenceData = Object.keys(confidenceRanges)
    .filter(range => confidenceRanges[range].total > 0)
    .map(range => ({
      range,
      accuracy: (confidenceRanges[range].correct / confidenceRanges[range].total) * 100,
      count: confidenceRanges[range].total
    }));

  // UP vs DOWN accuracy
  const upPredictions = resolvedPredictions.filter(p => p.prediction === 'UP');
  const downPredictions = resolvedPredictions.filter(p => p.prediction === 'DOWN');

  const upAccuracy = upPredictions.length > 0
    ? (upPredictions.filter(p => p.actual === 'UP').length / upPredictions.length) * 100
    : 0;

  const downAccuracy = downPredictions.length > 0
    ? (downPredictions.filter(p => p.actual === 'DOWN').length / downPredictions.length) * 100
    : 0;

  const directionData = [
    { name: 'UP Predictions', accuracy: upAccuracy, count: upPredictions.length },
    { name: 'DOWN Predictions', accuracy: downAccuracy, count: downPredictions.length }
  ];

  // Pie chart for prediction distribution
  const pieData = [
    { name: 'UP', value: filteredPredictions.filter(p => p.prediction === 'UP').length, color: '#10B981' },
    { name: 'DOWN', value: filteredPredictions.filter(p => p.prediction === 'DOWN').length, color: '#EF4444' }
  ];

  // Overall stats
  const totalCorrect = resolvedPredictions.filter(p => p.prediction === p.actual).length;
  const overallAccuracy = resolvedPredictions.length > 0
    ? (totalCorrect / resolvedPredictions.length) * 100
    : 0;

  const avgConfidence = filteredPredictions.length > 0
    ? filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / filteredPredictions.length
    : 0;

  // Most predicted symbols
  const symbolCounts = {};
  filteredPredictions.forEach(pred => {
    symbolCounts[pred.symbol] = (symbolCounts[pred.symbol] || 0) + 1;
  });

  const topSymbols = Object.keys(symbolCounts)
    .map(symbol => ({ symbol, count: symbolCounts[symbol] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Performance Analytics</h3>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-blue-100`
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Overall Accuracy</p>
          <p className="text-2xl font-bold text-blue-600">{overallAccuracy.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">{totalCorrect}/{resolvedPredictions.length} correct</p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Avg Confidence</p>
          <p className="text-2xl font-bold text-purple-600">{avgConfidence.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">Across all predictions</p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Best Symbol</p>
          <p className="text-2xl font-bold text-green-600">
            {bestPerformer ? bestPerformer.symbol : 'N/A'}
          </p>
          <p className="text-xs text-gray-500">
            {bestPerformer ? `${bestPerformer.accuracy.toFixed(0)}% accuracy` : ''}
          </p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Total Predictions</p>
          <p className="text-2xl font-bold text-orange-600">{filteredPredictions.length}</p>
          <p className="text-xs text-gray-500">{resolvedPredictions.length} resolved</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Symbol Performance Chart */}
        {symbolData.length > 0 && (
          <div>
            <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>Accuracy by Symbol (Top 10)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={symbolData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                  stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                />
                <YAxis
                  type="category"
                  dataKey="symbol"
                  tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                  stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? '#F3F4F6' : '#1F2937',
                    border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    `${value.toFixed(1)}% (${props.payload.correct}/${props.payload.total})`,
                    'Accuracy'
                  ]}
                />
                <Bar dataKey="accuracy" fill={darkMode ? '#60A5FA' : '#3B82F6'} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Prediction Distribution */}
        <div>
          <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>Prediction Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? '#F3F4F6' : '#1F2937',
                  border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* UP vs DOWN Accuracy */}
        <div>
          <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>Accuracy by Direction</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={directionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                stroke={darkMode ? '#6B7280' : '#9CA3AF'}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                stroke={darkMode ? '#6B7280' : '#9CA3AF'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? '#F3F4F6' : '#1F2937',
                  border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '8px'
                }}
                formatter={(value, name, props) => [
                  `${value.toFixed(1)}% (${props.payload.count} predictions)`,
                  'Accuracy'
                ]}
              />
              <Bar dataKey="accuracy" fill={darkMode ? '#34D399' : '#10B981'} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Range Accuracy */}
        {confidenceData.length > 0 && (
          <div>
            <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>Accuracy by Confidence Range</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                  stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                  stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#374151' : 'white',
                    color: darkMode ? '#F3F4F6' : '#1F2937',
                    border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    `${value.toFixed(1)}% (${props.payload.count} predictions)`,
                    'Accuracy'
                  ]}
                />
                <Bar dataKey="accuracy" fill={darkMode ? '#FBBF24' : '#F59E0B'} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Symbols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-green-600" />
            <h4 className={`font-semibold ${textPrimary}`}>Most Predicted Symbols</h4>
          </div>
          <div className="space-y-2">
            {topSymbols.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className={textPrimary}>{idx + 1}. {item.symbol}</span>
                <span className={`font-semibold ${textSecondary}`}>{item.count} predictions</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <h4 className={`font-semibold ${textPrimary}`}>Performance Insights</h4>
          </div>
          <div className={`space-y-2 text-sm ${textSecondary}`}>
            <p>• UP predictions: {upAccuracy.toFixed(1)}% accurate ({upPredictions.length} total)</p>
            <p>• DOWN predictions: {downAccuracy.toFixed(1)}% accurate ({downPredictions.length} total)</p>
            {bestPerformer && (
              <p>• Best performer: {bestPerformer.symbol} ({bestPerformer.accuracy.toFixed(0)}%)</p>
            )}
            {worstPerformer && bestPerformer !== worstPerformer && (
              <p>• Worst performer: {worstPerformer.symbol} ({worstPerformer.accuracy.toFixed(0)}%)</p>
            )}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
        <p className={`text-xs ${textSecondary}`}>
          <strong>Note:</strong> Analytics are based on resolved predictions only. Accuracy percentages
          may vary as more predictions are resolved. Historical performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}

export default PerformanceAnalytics;
