import React, { useState, useEffect } from 'react';
import { Shield, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function RiskMetrics({ symbol, darkMode }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    if (symbol) {
      fetchMetrics();
    }
  }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/risk-metrics/${symbol}`);
      if (response.data.success) {
        setMetrics(response.data.metrics);
      }
    } catch (err) {
      setError('Failed to load risk metrics');
      console.error('Risk metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!symbol) return null;

  if (loading) {
    return (
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6 animate-pulse`}>
        <div className={`h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-4`}></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Risk Assessment</h3>
        </div>
        <p className={`${textSecondary}`}>Unable to load risk metrics. Please try again later.</p>
      </div>
    );
  }

  if (!metrics) return null;

  const getSharpeRating = (sharpe) => {
    if (sharpe > 2) return { text: 'Excellent', color: 'text-green-600' };
    if (sharpe > 1) return { text: 'Good', color: 'text-blue-600' };
    if (sharpe > 0) return { text: 'Fair', color: 'text-yellow-600' };
    return { text: 'Poor', color: 'text-red-600' };
  };

  const getVolatilityRating = (vol) => {
    if (vol < 15) return { text: 'Low', color: 'text-green-600' };
    if (vol < 25) return { text: 'Moderate', color: 'text-yellow-600' };
    return { text: 'High', color: 'text-red-600' };
  };

  const sharpeRating = getSharpeRating(metrics.sharpe_ratio);
  const volRating = getVolatilityRating(metrics.volatility);

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-orange-500" />
        <h3 className={`text-xl font-bold ${textPrimary}`}>Risk Assessment</h3>
        <span className={`ml-auto text-sm ${textSecondary}`}>for {symbol}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Sharpe Ratio */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <p className={`text-sm ${textSecondary}`}>Sharpe Ratio</p>
          </div>
          <p className={`text-2xl font-bold ${textPrimary}`}>{metrics.sharpe_ratio}</p>
          <p className={`text-xs ${sharpeRating.color} font-semibold mt-1`}>{sharpeRating.text}</p>
        </div>

        {/* Volatility */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <p className={`text-sm ${textSecondary}`}>Volatility</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{metrics.volatility}%</p>
          <p className={`text-xs ${volRating.color} font-semibold mt-1`}>{volRating.text}</p>
        </div>

        {/* Max Drawdown */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className={`text-sm ${textSecondary}`}>Max Drawdown</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{metrics.max_drawdown}%</p>
          <p className="text-xs text-gray-500 mt-1">Worst decline</p>
        </div>

        {/* Beta */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-900 bg-opacity-20' : 'bg-purple-50'}`}>
          <p className={`text-sm ${textSecondary} mb-2`}>Beta (vs SPY)</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{metrics.beta}</p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.beta > 1 ? 'More volatile' : metrics.beta < 1 ? 'Less volatile' : 'Same as market'}
          </p>
        </div>

        {/* Value at Risk */}
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900 bg-opacity-20' : 'bg-green-50'}`}>
          <p className={`text-sm ${textSecondary} mb-2`}>VaR (95%)</p>
          <p className="text-2xl font-bold text-green-600">{metrics.var_95}%</p>
          <p className="text-xs text-gray-500 mt-1">Daily risk</p>
        </div>
      </div>

      {/* Interpretation */}
      <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <h4 className={`text-sm font-semibold ${textPrimary} mb-2`}>Understanding Risk Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <strong className={textPrimary}>Sharpe Ratio:</strong>
            <span className={`ml-2 ${textSecondary}`}>
              Measures risk-adjusted returns. &gt;1 is good, &gt;2 is excellent.
            </span>
          </div>
          <div>
            <strong className={textPrimary}>Volatility:</strong>
            <span className={`ml-2 ${textSecondary}`}>
              Annualized price fluctuation. Higher = more risky.
            </span>
          </div>
          <div>
            <strong className={textPrimary}>Max Drawdown:</strong>
            <span className={`ml-2 ${textSecondary}`}>
              Largest peak-to-trough decline over the past year.
            </span>
          </div>
          <div>
            <strong className={textPrimary}>Beta:</strong>
            <span className={`ml-2 ${textSecondary}`}>
              Volatility compared to market. 1.0 = same as S&P 500.
            </span>
          </div>
          <div className="md:col-span-2">
            <strong className={textPrimary}>VaR (95%):</strong>
            <span className={`ml-2 ${textSecondary}`}>
              Expected maximum daily loss at 95% confidence level.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskMetrics;