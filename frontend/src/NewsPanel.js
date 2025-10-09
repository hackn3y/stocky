import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function NewsPanel({ symbol, darkMode }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-600' : 'border-gray-300';

  useEffect(() => {
    if (symbol) {
      fetchNews();
    }
  }, [symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/news/${symbol}`);
      if (response.data.success) {
        setNews(response.data.news);
      }
    } catch (err) {
      setError('Failed to load news');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!symbol) return null;

  // Determine how many articles to show
  const articlesToShow = expanded ? news.length : 3;
  const hasMoreArticles = news.length > 3;

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-blue-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Latest News</h3>
          {symbol && <span className={`text-sm ${textSecondary}`}>for {symbol}</span>}
        </div>
        {hasMoreArticles && !loading && !error && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-1 px-3 py-1 text-sm font-medium ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } rounded-lg transition-colors ${textPrimary}`}
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All ({news.length}) <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && !error && news.length === 0 && (
        <p className={textSecondary}>No news available for this symbol.</p>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="space-y-2">
          {news.slice(0, articlesToShow).map((article, index) => (
            <a
              key={index}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-3 border ${borderColor} rounded-lg ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } transition-colors`}
            >
              <div className="flex items-start gap-3">
                {expanded && article.thumbnail && (
                  <img
                    src={article.thumbnail}
                    alt=""
                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${textPrimary} mb-1 ${expanded ? 'line-clamp-2' : 'line-clamp-1'} text-sm`}>
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`${textSecondary} flex items-center gap-1`}>
                      {article.publisher}
                    </span>
                    <span className={`${textSecondary} flex items-center gap-1`}>
                      <Clock className="h-3 w-3" />
                      {formatTime(article.publish_time)}
                    </span>
                  </div>
                </div>
                <ExternalLink className={`h-3 w-3 ${textSecondary} flex-shrink-0 mt-1`} />
              </div>
            </a>
          ))}
          {!expanded && hasMoreArticles && (
            <div className={`text-center pt-2 text-xs ${textSecondary}`}>
              {news.length - 3} more article{news.length - 3 > 1 ? 's' : ''} available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NewsPanel;
