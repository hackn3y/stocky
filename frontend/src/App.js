import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Info } from 'lucide-react';
import './index.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 bg-gray-100 rounded-lg border-2 border-gray-200">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-300 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
);

// Chart Loading Skeleton
const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-1/4 mb-6"></div>
    <div className="h-64 bg-gray-100 rounded"></div>
  </div>
);

function App() {
  const [symbol, setSymbol] = useState('SPY');
  const [prediction, setPrediction] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Fetch prediction
  const getPrediction = async (ticker = symbol) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/predict/${ticker}`);

      if (response.data.success) {
        setPrediction(response.data);
      } else {
        setError(response.data.error || 'Failed to get prediction');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Network error');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical data
  const getHistoricalData = async (ticker = symbol) => {
    try {
      const response = await axios.get(`${API_URL}/historical/${ticker}?period=3mo&interval=1d`);

      if (response.data.success) {
        const data = response.data.data;
        const formattedData = data.dates.map((date, index) => ({
          date: new Date(date).toLocaleDateString(),
          price: data.close[index],
          volume: data.volume[index]
        }));
        setHistoricalData(formattedData);
      }
    } catch (err) {
      console.error('Historical data error:', err);
    }
  };

  // Fetch stock info
  const getStockInfo = async (ticker = symbol) => {
    try {
      const response = await axios.get(`${API_URL}/info/${ticker}`);

      if (response.data.success) {
        setStockInfo(response.data.info);
      }
    } catch (err) {
      console.error('Stock info error:', err);
    }
  };

  // Handle symbol submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      const ticker = symbol.trim().toUpperCase();
      setSymbol(ticker);
      getPrediction(ticker);
      getHistoricalData(ticker);
      getStockInfo(ticker);
    }
  };

  // Load default data on mount
  useEffect(() => {
    getPrediction();
    getHistoricalData();
    getStockInfo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Stock Market Predictor
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">How It Works</span>
              </button>
              <div className="text-sm text-gray-500">
                Powered by ML (51.88% accuracy)
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-lg font-semibold"
              placeholder="Enter stock symbol (e.g., SPY, AAPL, TSLA)"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Predict'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* How It Works Modal */}
        {showHowItWorks && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 text-gray-700">
                  <section>
                    <h3 className="text-xl font-semibold text-indigo-600 mb-2">Machine Learning Model</h3>
                    <p>Our predictor uses a <strong>Random Forest Classifier</strong> trained on historical stock data. The model analyzes 30+ technical indicators to predict if a stock will go UP or DOWN the next trading day.</p>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold text-indigo-600 mb-2">Technical Indicators (30 Features)</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Momentum:</strong> RSI, MACD, Stochastic, Williams %R, ROC</li>
                      <li><strong>Moving Averages:</strong> SMA (5, 20, 50 day), EMA (12, 26 day)</li>
                      <li><strong>Volatility:</strong> Bollinger Bands, ATR (Average True Range)</li>
                      <li><strong>Volume:</strong> OBV (On-Balance Volume), MFI (Money Flow Index)</li>
                      <li><strong>Trend:</strong> CCI (Commodity Channel Index), Directional Indicators</li>
                      <li><strong>Patterns:</strong> Consecutive up/down days, gaps, intraday range</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold text-indigo-600 mb-2">How Predictions Work</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Download 3 months of historical price data (OHLCV) using Yahoo Finance API</li>
                      <li>Calculate 30 technical indicators from the price data</li>
                      <li>Feed the latest indicator values into the trained Random Forest model</li>
                      <li>Model outputs probabilities for UP vs DOWN movement</li>
                      <li>Display prediction with confidence percentage</li>
                    </ol>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold text-indigo-600 mb-2">Model Performance</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Test Accuracy:</strong> 51.88% (trained on SPY)</li>
                      <li><strong>Training Data:</strong> ~2,708 days of historical data</li>
                      <li><strong>Algorithm:</strong> Random Forest (300 estimators)</li>
                    </ul>
                  </section>

                  <section className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimer</h3>
                    <p className="text-sm text-yellow-700">
                      <strong>51.88% accuracy is only slightly better than random chance (50%).</strong> This is for educational purposes only.
                      Stock markets are extremely difficult to predict. Do NOT invest real money based on these predictions.
                      Always do your own research and consult with financial advisors.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-semibold text-indigo-600 mb-2">Technology Stack</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Backend:</strong> Python, Flask, scikit-learn, yfinance</li>
                      <li><strong>Frontend:</strong> React, Tailwind CSS, Recharts</li>
                      <li><strong>Deployment:</strong> Railway (backend), Vercel (frontend)</li>
                    </ul>
                  </section>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Card */}
        {loading && !prediction ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Loading Prediction...</h2>
            <LoadingSkeleton />
          </div>
        ) : prediction ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Prediction for {prediction.symbol}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prediction Result */}
              <div className={`p-6 rounded-lg ${
                prediction.prediction === 'UP'
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium text-gray-700">Direction</span>
                  {prediction.prediction === 'UP' ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div className={`text-4xl font-bold ${
                  prediction.prediction === 'UP' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {prediction.prediction}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Next trading day prediction
                </div>
              </div>

              {/* Confidence */}
              <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-lg font-medium text-gray-700 mb-4">Confidence</div>
                <div className="text-4xl font-bold text-blue-600">
                  {prediction.confidence.toFixed(1)}%
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Up Probability</span>
                    <span className="font-semibold text-green-600">
                      {prediction.probabilities.up.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Down Probability</span>
                    <span className="font-semibold text-red-600">
                      {prediction.probabilities.down.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Price */}
              <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="text-lg font-medium text-gray-700 mb-4">Current Price</div>
                <div className="text-4xl font-bold text-gray-800">
                  ${prediction.current_price.toFixed(2)}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Latest closing price
                </div>
              </div>

              {/* Stock Info */}
              {stockInfo && (
                <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="text-lg font-medium text-gray-700 mb-4">Stock Info</div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-semibold text-gray-800">
                        {stockInfo.name || 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Exchange:</span>
                      <span className="ml-2 font-semibold text-gray-800">
                        {stockInfo.exchange || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Historical Chart */}
        {loading && historicalData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ChartSkeleton />
          </div>
        ) : historicalData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              3-Month Price History
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This is for educational purposes only. Not financial advice.
            Do not risk real money based on these predictions. The model has approximately 52% accuracy,
            which is only slightly better than random chance.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-md mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            Built with React, Flask, and Machine Learning | Model: Random Forest (51.88% accuracy)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
