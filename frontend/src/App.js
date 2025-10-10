// Version 2.0.9 - Regenerate favicon.ico with Stocky branding
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Info, Moon, Sun, Star, StarOff, BarChart3, Download, Share2, Clock, ChevronDown, ChevronUp, User, LogOut, Search } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { ToastContainer, useToast } from './Toast';
import { ErrorDisplay, NetworkStatus, useNetworkStatus, withRetry } from './ErrorRecovery';
import { PredictionSkeleton, ChartSkeleton } from './LoadingSkeletons';
import { useAuth } from './AuthContext';
import { exportToCSV, sharePrediction, copyToClipboard } from './utils';
import './index.css';

// Lazy load heavy components for better initial load performance
const WatchlistEnhanced = lazy(() => import('./WatchlistEnhanced'));
const ComparisonView = lazy(() => import('./ComparisonView'));
const Portfolio = lazy(() => import('./Portfolio'));
const AccuracyTracker = lazy(() => import('./AccuracyTracker'));
const NewsPanel = lazy(() => import('./NewsPanel'));
const AuthModal = lazy(() => import('./AuthModal'));
const SocialFeed = lazy(() => import('./SocialFeed'));
const BacktestingDashboard = lazy(() => import('./BacktestingDashboard'));
const AlertsPanel = lazy(() => import('./AlertsPanel'));
const AIAssistant = lazy(() => import('./AIAssistant'));
const PaperTrading = lazy(() => import('./PaperTrading'));
const TechnicalChart = lazy(() => import('./TechnicalChart'));
const PerformanceAnalytics = lazy(() => import('./PerformanceAnalytics'));
const MobileNav = lazy(() => import('./MobileNav'));

// Loading fallback component
const LoadingFallback = ({ darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6 animate-pulse`}>
    <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-4`}></div>
    <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 mb-2`}></div>
    <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`}></div>
  </div>
);

// Force use Railway backend in production
const API_URL = process.env.REACT_APP_API_URL || 'https://stocky-production-16bc.up.railway.app/api';

// Utility function to check if symbol is cryptocurrency
const isCrypto = (symbol) => {
  return symbol && symbol.includes('-USD');
};

// Utility function to get asset type badge
const getAssetBadge = (symbol) => {
  if (isCrypto(symbol)) {
    return { text: 'CRYPTO', color: 'bg-orange-100 text-orange-700 border-orange-300' };
  }
  return null;
};

// Utility function to get timeframe display name
const getTimeframeLabel = (period) => {
  const labels = {
    '1d': '1-Day',
    '1w': '1-Week',
    '1mo': '1-Month',
    '3mo': '3-Month',
    '1y': '1-Year',
    'max': 'All Time'
  };
  return labels[period] || '3-Month';
};

// Utility function to reduce data points for better chart performance
const reduceDataPoints = (data, maxPoints = 200) => {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const reduced = [];

  for (let i = 0; i < data.length; i += step) {
    reduced.push(data[i]);
  }

  // Always include the last data point
  if (reduced[reduced.length - 1] !== data[data.length - 1]) {
    reduced.push(data[data.length - 1]);
  }

  return reduced;
};

// Utility functions for localStorage
const getFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

function App() {
  // Auth
  const { user, isAuthenticated, updateUser, logout } = useAuth();

  // Toast and Network Status
  const { toasts, addToast, removeToast } = useToast();
  const isOnline = useNetworkStatus();

  // Existing state
  const [symbol, setSymbol] = useState(() => getFromStorage('lastSymbol', 'SPY'));
  const [prediction, setPrediction] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // New features state
  const [darkMode, setDarkMode] = useState(() => getFromStorage('darkMode', false));
  const [watchlist, setWatchlist] = useState(() => getFromStorage('watchlist', []));
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonSymbols, setComparisonSymbols] = useState(['SPY', 'QQQ', 'VOO']);
  const [comparisonData, setComparisonData] = useState([]);

  // More new features
  const [searchHistory, setSearchHistory] = useState(() => getFromStorage('searchHistory', []));
  const [showHistory, setShowHistory] = useState(false);
  const [portfolio, setPortfolio] = useState(() => getFromStorage('portfolio', []));
  const [predictions, setPredictions] = useState(() => getFromStorage('predictions', []));
  const [showDetails, setShowDetails] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [shareMenu, setShareMenu] = useState(false);
  const [timeframe, setTimeframe] = useState('3mo');

  // Advanced features state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Stock search state
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Refs
  const searchInputRef = useRef(null);
  const historicalDataCache = useRef({}); // Cache for historical data: { 'SPY-3mo': [...data], 'AAPL-1y': [...data] }

  // Fetch prediction with retry and toast
  const getPrediction = async (ticker = symbol) => {
    setLoading(true);
    setError(null);

    try {
      const response = await withRetry(
        () => axios.get(`${API_URL}/predict/${ticker}`),
        3,
        1000
      );

      if (response.data.success) {
        setPrediction(response.data);

        // Add to search history (unique, max 10)
        const newHistory = [ticker, ...searchHistory.filter(s => s !== ticker)].slice(0, 10);
        setSearchHistory(newHistory);

        // Add to predictions tracker
        const newPrediction = {
          symbol: ticker,
          prediction: response.data.prediction,
          confidence: response.data.confidence,
          date: new Date().toISOString(),
          actual: null // Will be resolved later
        };
        setPredictions(prevPredictions => {
          const updatedPredictions = [newPrediction, ...prevPredictions].slice(0, 50);

          // Sync with auth context if logged in (after state update)
          if (isAuthenticated && updateUser) {
            // Use setTimeout to defer state update to next tick
            setTimeout(() => {
              updateUser({ predictions: updatedPredictions });
            }, 0);
          }

          return updatedPredictions;
        });

        // Success toast
        addToast(`Prediction for ${ticker}: ${response.data.prediction}`, 'success', 3000);
      } else {
        const errorMsg = response.data.error || 'Failed to get prediction';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Network error - please check your connection';
      setError(errorMsg);
      addToast(errorMsg, 'error');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical data with timeframe support and caching
  const getHistoricalData = async (ticker = symbol, period = timeframe) => {
    try {
      // Create cache key
      const cacheKey = `${ticker}-${period}`;

      // Check cache first - instant load for cached data
      if (historicalDataCache.current[cacheKey]) {
        setHistoricalData(historicalDataCache.current[cacheKey]);
        return;
      }

      // Map timeframes to Yahoo Finance period and interval formats
      const timeframeConfig = {
        '1d': { period: '1d', interval: '5m' },     // 1 day: 5-minute intervals
        '1w': { period: '5d', interval: '1h' },     // 1 week: use 5d with 1-hour intervals
        '1mo': { period: '1mo', interval: '1d' },   // 1 month: 1-day intervals
        '3mo': { period: '3mo', interval: '1d' },   // 3 months: 1-day intervals
        '1y': { period: '1y', interval: '1d' },     // 1 year: 1-day intervals
        'max': { period: 'max', interval: '1wk' }   // Max: 1-week intervals
      };

      const config = timeframeConfig[period] || timeframeConfig['3mo'];
      const response = await axios.get(`${API_URL}/historical/${ticker}?period=${config.period}&interval=${config.interval}`);

      if (response.data.success) {
        const data = response.data.data;
        const formattedData = data.dates.map((date, index) => ({
          date: new Date(date).toLocaleDateString(),
          price: data.close[index],
          volume: data.volume[index]
        }));
        // Apply data reduction for better chart performance
        const processedData = reduceDataPoints(formattedData);

        // Store in cache
        historicalDataCache.current[cacheKey] = processedData;

        // Update state
        setHistoricalData(processedData);
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

  // Stock search function
  const searchStocks = async (query) => {
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.results);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  // Handle symbol input change with debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (symbol && symbol.length >= 1 && !loading) {
        searchStocks(symbol);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle symbol submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      const ticker = symbol.trim().toUpperCase();
      setSymbol(ticker);
      saveToStorage('lastSymbol', ticker); // Remember last searched symbol
      getPrediction(ticker);
      getHistoricalData(ticker);
      getStockInfo(ticker);
      setShowSearchResults(false);
      setShowHistory(false);
    }
  };

  // Handle stock selection from search
  const selectStock = (stock) => {
    setSymbol(stock.symbol);
    saveToStorage('lastSymbol', stock.symbol); // Remember last searched symbol
    getPrediction(stock.symbol);
    getHistoricalData(stock.symbol);
    getStockInfo(stock.symbol);
    setShowSearchResults(false);
    setShowHistory(false);
  };

  // Load default data on mount - only once
  useEffect(() => {
    // Add a flag to prevent multiple calls
    let mounted = true;

    if (mounted) {
      getPrediction();
      getHistoricalData();
      getStockInfo();
    }

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dark mode effect
  useEffect(() => {
    saveToStorage('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Watchlist effect
  useEffect(() => {
    saveToStorage('watchlist', watchlist);
  }, [watchlist]);

  // Save other state to localStorage
  useEffect(() => {
    saveToStorage('searchHistory', searchHistory);
  }, [searchHistory]);

  useEffect(() => {
    saveToStorage('portfolio', portfolio);
  }, [portfolio]);

  useEffect(() => {
    saveToStorage('predictions', predictions);
  }, [predictions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // D for dark mode (when not typing in input)
      if (e.key === 'd' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        toggleDarkMode();
      }
      // / to focus search
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowComparison(false);
        setShowHowItWorks(false);
        setShareMenu(false);
        setShowHistory(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [darkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dark mode toggle
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Watchlist functions
  const addToWatchlist = (ticker) => {
    if (!watchlist.includes(ticker)) {
      setWatchlist([...watchlist, ticker]);
    }
  };

  const removeFromWatchlist = (ticker) => {
    setWatchlist(watchlist.filter(s => s !== ticker));
  };

  const isInWatchlist = (ticker) => watchlist.includes(ticker);

  // Bulk watchlist refresh
  const bulkRefreshWatchlist = async (symbols) => {
    try {
      addToast(`Refreshing ${symbols.length} symbols...`, 'info', 2000);
      const response = await axios.post(`${API_URL}/predict/batch`, { symbols });
      if (response.data.success) {
        addToast(`Successfully refreshed ${response.data.predictions.length} symbols`, 'success');
      }
    } catch (err) {
      addToast('Failed to refresh watchlist', 'error');
      console.error('Bulk refresh error:', err);
    }
  };

  // Comparison functions
  const fetchComparisonData = async () => {
    try {
      const response = await axios.post(`${API_URL}/predict/batch`, {
        symbols: comparisonSymbols
      });

      if (response.data.success) {
        setComparisonData(response.data.predictions);
      }
    } catch (err) {
      console.error('Comparison error:', err);
    }
  };

  const removeComparisonSymbol = (ticker) => {
    setComparisonSymbols(comparisonSymbols.filter(s => s !== ticker));
  };

  const addComparisonSymbol = (ticker) => {
    if (!comparisonSymbols.includes(ticker) && comparisonSymbols.length < 5) {
      setComparisonSymbols([...comparisonSymbols, ticker]);
    }
  };

  // Portfolio handlers
  const addToPortfolio = async (stock) => {
    // Get current price
    try {
      const response = await axios.get(`${API_URL}/predict/${stock.symbol}`);
      if (response.data.success) {
        const newStock = { ...stock, currentPrice: response.data.current_price };
        setPortfolio([...portfolio, newStock]);
      }
    } catch (err) {
      console.error('Failed to add to portfolio:', err);
    }
  };

  const removeFromPortfolio = (index) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const updatePortfolioPrices = async () => {
    const symbols = portfolio.map(p => p.symbol);
    if (symbols.length === 0) return;

    try {
      const response = await axios.post(`${API_URL}/predict/batch`, { symbols });
      if (response.data.success) {
        const updatedPortfolio = portfolio.map(stock => {
          const predData = response.data.predictions.find(p => p.symbol === stock.symbol);
          return predData ? { ...stock, currentPrice: predData.current_price } : stock;
        });
        setPortfolio(updatedPortfolio);
      }
    } catch (err) {
      console.error('Failed to update portfolio prices:', err);
    }
  };

  // Update portfolio prices on mount
  useEffect(() => {
    if (portfolio.length > 0) {
      updatePortfolioPrices();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme classes
  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-200`}>
      {/* Progress Bar */}
      <ProgressBar loading={loading} />

      {/* Header */}
      <header className={`${cardBg} shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-indigo-600" />
              <h1 className={`text-3xl font-bold ${textPrimary}`}>
                Stock Market Predictor
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                title="How It Works"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">How It Works</span>
              </button>
              <button
                onClick={() => {
                  setShowComparison(!showComparison);
                  if (!showComparison) fetchComparisonData();
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                title="Compare Stocks"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">Compare</span>
              </button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-gray-700 text-gray-100 hover:bg-gray-600'}`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{user?.username}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  title="Login / Sign Up"
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">Login</span>
                </button>
              )}
              <div className={`text-sm ${textSecondary} hidden md:block`}>
                ML (54.51% accuracy)
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8" id="dashboard">
        {/* Search Form */}
        <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
          <div className="relative">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
              {/* Search Input - Full width on mobile, flex on desktop */}
              <div className="w-full md:flex-1 relative">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    onFocus={() => {
                      setShowHistory(true);
                      setShowSearchResults(true);
                    }}
                    onBlur={() => setTimeout(() => {
                      setShowHistory(false);
                      setShowSearchResults(false);
                    }, 200)}
                    className={`w-full px-4 py-4 md:py-3 pl-12 text-lg border-2 ${borderColor} rounded-lg focus:outline-none focus:border-indigo-500 font-semibold ${textPrimary} ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                    placeholder="Search symbol (e.g., AAPL, META)"
                    disabled={loading}
                  />
                  <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${textSecondary}`} />
                </div>

                {/* Stock Search Results */}
                {showSearchResults && symbol.length >= 1 && searchResults.length > 0 && (
                  <div className={`absolute z-10 w-full mt-2 ${cardBg} border ${borderColor} rounded-lg shadow-lg max-h-80 overflow-y-auto`}>
                    <div className={`px-3 py-2 border-b ${borderColor} flex items-center gap-2`}>
                      <Search className="h-4 w-4 text-blue-500" />
                      <span className={`text-sm font-semibold ${textSecondary}`}>Search Results</span>
                    </div>
                    {searchResults.map((stock, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectStock(stock)}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 ${textPrimary} transition-colors border-b ${borderColor} last:border-b-0`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{stock.symbol}</div>
                            <div className={`text-sm ${textSecondary}`}>{stock.name}</div>
                          </div>
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Search History Dropdown */}
                {showHistory && !showSearchResults && searchHistory.length > 0 && (
                  <div className={`absolute z-10 w-full mt-2 ${cardBg} border ${borderColor} rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                    <div className={`px-3 py-2 border-b ${borderColor} flex items-center gap-2`}>
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className={`text-sm font-semibold ${textSecondary}`}>Recent Searches</span>
                    </div>
                    {searchHistory.map((hist, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSymbol(hist);
                          saveToStorage('lastSymbol', hist); // Remember last searched symbol
                          getPrediction(hist);
                          getHistoricalData(hist);
                          getStockInfo(hist);
                          setShowHistory(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900 ${textPrimary} transition-colors`}
                      >
                        {hist}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons - Wrap on mobile, inline on desktop */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Predict'}
                </button>
                {prediction && (
                  <>
                    <button
                      type="button"
                      onClick={() => isInWatchlist(symbol) ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
                      className={`p-3 rounded-lg transition-colors ${isInWatchlist(symbol) ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                      title={isInWatchlist(symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {isInWatchlist(symbol) ? <Star className="h-6 w-6" fill="currentColor" /> : <StarOff className="h-6 w-6" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => exportToCSV(prediction, historicalData, stockInfo)}
                      className="p-3 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                      title="Export to CSV"
                    >
                      <Download className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareMenu(!shareMenu)}
                      className="p-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors relative"
                      title="Share"
                    >
                      <Share2 className="h-6 w-6" />
                      {shareMenu && (
                        <div className={`absolute right-0 top-full mt-2 ${cardBg} border ${borderColor} rounded-lg shadow-lg py-2 z-10 min-w-[150px]`}>
                          <button onClick={() => { sharePrediction(prediction, 'twitter'); setShareMenu(false); }} className={`w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}>Twitter</button>
                          <button onClick={() => { sharePrediction(prediction, 'linkedin'); setShareMenu(false); }} className={`w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}>LinkedIn</button>
                          <button onClick={() => { sharePrediction(prediction, 'facebook'); setShareMenu(false); }} className={`w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}>Facebook</button>
                          <button onClick={() => { copyToClipboard(`${prediction.symbol}: ${prediction.prediction} (${prediction.confidence.toFixed(1)}%)`); setShareMenu(false); }} className={`w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${textPrimary}`}>Copy</button>
                        </div>
                      )}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Watchlist Enhanced */}
        <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
          <WatchlistEnhanced
            watchlist={watchlist}
            onRemove={removeFromWatchlist}
            onSelect={(ticker) => {
              setSymbol(ticker);
              saveToStorage('lastSymbol', ticker); // Remember last searched symbol
              getPrediction(ticker);
              getHistoricalData(ticker);
              getStockInfo(ticker);
            }}
            onBulkRefresh={bulkRefreshWatchlist}
            darkMode={darkMode}
          />
        </Suspense>

        {/* Comparison View Modal */}
        {showComparison && (
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <ComparisonView
              comparisonData={comparisonData}
              comparisonSymbols={comparisonSymbols}
              onClose={() => setShowComparison(false)}
              onRemoveSymbol={(ticker) => {
                removeComparisonSymbol(ticker);
                setTimeout(fetchComparisonData, 100);
              }}
              onAddSymbol={(ticker) => {
                addComparisonSymbol(ticker);
                setTimeout(fetchComparisonData, 100);
              }}
              darkMode={darkMode}
            />
          </Suspense>
        )}

        {/* Portfolio Tracker */}
        <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
          <Portfolio
            portfolio={portfolio}
            onAdd={addToPortfolio}
            onRemove={removeFromPortfolio}
            onUpdate={updatePortfolioPrices}
            darkMode={darkMode}
          />
        </Suspense>

        {/* Accuracy Tracker */}
        <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
          <AccuracyTracker
            predictions={predictions}
            darkMode={darkMode}
          />
        </Suspense>

        {/* Error Message with Retry */}
        {error && !loading && (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              setError(null);
              getPrediction(symbol);
              getHistoricalData(symbol);
              getStockInfo(symbol);
            }}
            darkMode={darkMode}
            context="fetching prediction data"
          />
        )}

        {/* How It Works Modal */}
        {showHowItWorks && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cardBg} rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-2xl font-bold ${textPrimary}`}>How It Works</h2>
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className={`${textSecondary} hover:${textPrimary} text-2xl font-bold`}
                  >
                    ×
                  </button>
                </div>

                <div className={`space-y-4 ${textSecondary}`}>
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
                      <li><strong>Test Accuracy:</strong> 54.51% (trained on SPY)</li>
                      <li><strong>Training Data:</strong> ~2,708 days of historical data</li>
                      <li><strong>Algorithm:</strong> Enhanced Ensemble (XGBoost + CatBoost + Random Forest)</li>
                    </ul>
                  </section>

                  <section className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimer</h3>
                    <p className="text-sm text-yellow-700">
                      <strong>54.51% accuracy is only slightly better than random chance (50%).</strong> This is for educational purposes only.
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
          <PredictionSkeleton darkMode={darkMode} />
        ) : prediction ? (
          <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                Prediction for {prediction.symbol}
              </h2>
              {getAssetBadge(prediction.symbol) && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getAssetBadge(prediction.symbol).color}`}>
                  {getAssetBadge(prediction.symbol).text}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prediction Result */}
              <div className={`p-6 rounded-lg border-2 ${
                prediction.prediction === 'UP'
                  ? darkMode ? 'bg-green-900 bg-opacity-20 border-green-700' : 'bg-green-50 border-green-200'
                  : darkMode ? 'bg-red-900 bg-opacity-20 border-red-700' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-lg font-medium ${textPrimary}`}>Direction</span>
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
                <div className={`mt-2 text-sm ${textSecondary}`}>
                  Next trading day prediction
                </div>
              </div>

              {/* Confidence */}
              <div className={`p-6 rounded-lg border-2 ${darkMode ? 'bg-blue-900 bg-opacity-20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                <div className={`text-lg font-medium ${textPrimary} mb-4`}>Confidence</div>
                <div className="text-4xl font-bold text-blue-600">
                  {prediction.confidence.toFixed(1)}%
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={textSecondary}>Up Probability</span>
                    <span className="font-semibold text-green-600">
                      {prediction.probabilities.up.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={textSecondary}>Down Probability</span>
                    <span className="font-semibold text-red-600">
                      {prediction.probabilities.down.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Price */}
              <div className={`p-6 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-lg font-medium ${textPrimary} mb-4`}>Current Price</div>
                <div className={`text-4xl font-bold ${textPrimary}`}>
                  ${prediction.current_price.toFixed(2)}
                </div>
                <div className={`mt-2 text-sm ${textSecondary}`}>
                  Latest closing price
                </div>
              </div>

              {/* Stock Info */}
              {stockInfo && (
                <div className="p-6 bg-purple-50 dark:bg-purple-900 dark:bg-opacity-20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                  <div className={`text-lg font-medium ${textPrimary} mb-4`}>Stock Info</div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className={textSecondary}>Name:</span>
                      <span className={`ml-2 font-semibold ${textPrimary}`}>
                        {stockInfo.name || 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className={textSecondary}>Exchange:</span>
                      <span className={`ml-2 font-semibold ${textPrimary}`}>
                        {stockInfo.exchange || 'N/A'}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-indigo-600 hover:underline text-sm flex items-center gap-1 mt-2"
                    >
                      {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {showDetails ? 'Less Details' : 'More Details'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Stock Details */}
            {showDetails && stockInfo && (
              <div className={`mt-6 p-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <h3 className={`font-semibold ${textPrimary} mb-4`}>Detailed Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stockInfo.sector && (
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Sector:</span>
                      <span className={`ml-2 ${textPrimary}`}>{stockInfo.sector}</span>
                    </div>
                  )}
                  {stockInfo.industry && (
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Industry:</span>
                      <span className={`ml-2 ${textPrimary}`}>{stockInfo.industry}</span>
                    </div>
                  )}
                  {stockInfo.marketCap && (
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Market Cap:</span>
                      <span className={`ml-2 ${textPrimary}`}>${(stockInfo.marketCap / 1e9).toFixed(2)}B</span>
                    </div>
                  )}
                  {stockInfo.currency && (
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Currency:</span>
                      <span className={`ml-2 ${textPrimary}`}>{stockInfo.currency}</span>
                    </div>
                  )}
                  {stockInfo.website && (
                    <div className="col-span-2">
                      <span className={`text-sm ${textSecondary}`}>Website:</span>
                      <a href={stockInfo.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">
                        {stockInfo.website}
                      </a>
                    </div>
                  )}
                  {stockInfo.description && (
                    <div className="col-span-2">
                      <span className={`text-sm ${textSecondary} block mb-2`}>Description:</span>
                      <p className={`text-sm ${textPrimary}`}>{stockInfo.description.slice(0, 300)}...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Historical Chart */}
        {loading && historicalData.length === 0 ? (
          <ChartSkeleton darkMode={darkMode} />
        ) : historicalData.length > 0 ? (
          <div className={`${cardBg} rounded-lg shadow-md p-6`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                {getTimeframeLabel(timeframe)} Price History
              </h2>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Timeframe Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {['1d', '1w', '1mo', '3mo', '1y', 'max'].map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setTimeframe(period);
                        getHistoricalData(symbol, period);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        timeframe === period
                          ? 'bg-blue-600 text-white'
                          : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-blue-100`
                      }`}
                    >
                      {getTimeframeLabel(period)}
                    </button>
                  ))}
                </div>

                {/* Chart Type Selector */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      chartType === 'line'
                        ? 'bg-indigo-600 text-white'
                        : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-indigo-100`
                    }`}
                  >
                    Line Chart
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      chartType === 'bar'
                        ? 'bg-indigo-600 text-white'
                        : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-indigo-100`
                    }`}
                  >
                    Bar Chart
                  </button>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'line' ? (
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#374151' }}
                    interval="preserveStartEnd"
                    stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#374151' }}
                    stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#374151' : 'white',
                      color: darkMode ? '#F3F4F6' : '#1F2937',
                      border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: darkMode ? '#F3F4F6' : '#1F2937' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={darkMode ? '#818CF8' : '#4F46E5'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              ) : (
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#374151' }}
                    interval="preserveStartEnd"
                    stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#374151' }}
                    stroke={darkMode ? '#6B7280' : '#9CA3AF'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#374151' : 'white',
                      color: darkMode ? '#F3F4F6' : '#1F2937',
                      border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: darkMode ? '#F3F4F6' : '#1F2937' }}
                  />
                  <Bar
                    dataKey="price"
                    fill={darkMode ? '#818CF8' : '#4F46E5'}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : null}

        {/* News Panel */}
        {prediction && (
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <NewsPanel symbol={symbol} darkMode={darkMode} />
          </Suspense>
        )}

        {/* Technical Chart with Indicators */}
        <div id="technical">
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <TechnicalChart
              historicalData={historicalData}
              darkMode={darkMode}
              symbol={symbol}
            />
          </Suspense>
        </div>

        {/* Paper Trading Simulator */}
        <div id="trading">
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <PaperTrading
              darkMode={darkMode}
              currentSymbol={symbol}
              currentPrice={prediction?.current_price}
              prediction={prediction}
            />
          </Suspense>
        </div>

        {/* Performance Analytics */}
        <div id="performance">
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <PerformanceAnalytics predictions={predictions} darkMode={darkMode} />
          </Suspense>
        </div>

        {/* Social Feed */}
        <div id="social">
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <SocialFeed darkMode={darkMode} />
          </Suspense>
        </div>

        {/* Backtesting Dashboard */}
        <div id="backtesting">
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <BacktestingDashboard predictions={predictions} darkMode={darkMode} />
          </Suspense>
        </div>

        {/* Alerts Panel */}
        <div id="alerts">
          <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
            <AlertsPanel
              darkMode={darkMode}
              symbol={symbol}
              currentPrice={prediction?.current_price}
            />
          </Suspense>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This is for educational purposes only. Not financial advice.
            Do not risk real money based on these predictions. The model has approximately 54.5% accuracy,
            which is only slightly better than random chance.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${cardBg} shadow-md mt-12`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
            <p className={`text-center ${textSecondary} text-sm`}>
              Built with React, Flask, and Machine Learning | Model: Enhanced Ensemble (54.51% accuracy)
            </p>
            <span className={`text-xs ${textSecondary} opacity-75`}>
              v2.0.9
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
          <AuthModal onClose={() => setShowAuthModal(false)} darkMode={darkMode} />
        </Suspense>
      )}

      {/* AI Assistant */}
      <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
        <AIAssistant
          darkMode={darkMode}
          symbol={symbol}
          prediction={prediction}
          isOpen={showAIAssistant}
          setIsOpen={setShowAIAssistant}
        />
      </Suspense>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Network Status Indicator */}
      <NetworkStatus isOnline={isOnline} />

      {/* Mobile Navigation */}
      <Suspense fallback={<LoadingFallback darkMode={darkMode} />}>
        <MobileNav
          darkMode={darkMode}
          onNavigate={(id) => {
            if (id === 'info') {
              setShowHowItWorks(true);
            } else if (id === 'ai') {
              setShowAIAssistant(true);
            }
          }}
        />
      </Suspense>
    </div>
  );
}

export default App;
