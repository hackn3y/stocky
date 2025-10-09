import React from 'react';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

function AccuracyTracker({ predictions, darkMode }) {
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (!predictions || predictions.length === 0) {
    return null;
  }

  const resolvedPredictions = predictions.filter(p => p.actual !== null);
  const correct = resolvedPredictions.filter(p => p.prediction === p.actual).length;
  const accuracy = resolvedPredictions.length > 0 ? (correct / resolvedPredictions.length) * 100 : 0;

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-purple-500" />
        <h3 className={`text-xl font-bold ${textPrimary}`}>Prediction Accuracy</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>Overall Accuracy</p>
          <p className="text-3xl font-bold text-purple-600">{accuracy.toFixed(1)}%</p>
          <p className={`text-xs ${textSecondary} mt-1`}>{correct} of {resolvedPredictions.length} correct</p>
        </div>

        <div className="text-center p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>UP Predictions</p>
          <p className="text-3xl font-bold text-green-600">
            {predictions.filter(p => p.prediction === 'UP').length}
          </p>
          <p className={`text-xs ${textSecondary} mt-1`}>Total made</p>
        </div>

        <div className="text-center p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary} mb-1`}>DOWN Predictions</p>
          <p className="text-3xl font-bold text-red-600">
            {predictions.filter(p => p.prediction === 'DOWN').length}
          </p>
          <p className={`text-xs ${textSecondary} mt-1`}>Total made</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className={`font-semibold ${textPrimary} mb-3`}>Recent Predictions (Last 10)</h4>
        {predictions.slice(0, 10).map((pred, index) => (
          <div key={index} className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className="flex items-center gap-3">
              <span className={`font-bold ${textPrimary}`}>{pred.symbol}</span>
              <span className={`flex items-center gap-1 ${pred.prediction === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                {pred.prediction === 'UP' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {pred.prediction}
              </span>
              <span className={`text-sm ${textSecondary}`}>{pred.confidence.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${textSecondary}`}>{new Date(pred.date).toLocaleDateString()}</span>
              {pred.actual !== null && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  pred.prediction === pred.actual
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {pred.prediction === pred.actual ? '✓ Correct' : '✗ Wrong'}
                </span>
              )}
              {pred.actual === null && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className={`text-xs ${textSecondary} mt-4 text-center`}>
        Note: Predictions are automatically resolved the next trading day
      </p>
    </div>
  );
}

export default AccuracyTracker;
