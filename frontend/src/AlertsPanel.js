import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';

function AlertsPanel({ darkMode, symbol, currentPrice }) {
  const [alerts, setAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem('stocky_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: symbol || 'SPY',
    condition: 'above',
    price: ''
  });

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-600' : 'border-gray-300';

  useEffect(() => {
    localStorage.setItem('stocky_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    // Update form symbol when prop changes
    if (symbol) {
      setNewAlert(prev => ({ ...prev, symbol }));
    }
  }, [symbol]);

  useEffect(() => {
    // Check alerts against current price
    if (currentPrice && alerts.length > 0) {
      alerts.forEach(alert => {
        if (alert.triggered) return;

        const triggered =
          (alert.condition === 'above' && currentPrice >= alert.price) ||
          (alert.condition === 'below' && currentPrice <= alert.price);

        if (triggered) {
          // Mark as triggered
          setAlerts(prev =>
            prev.map(a =>
              a.id === alert.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
            )
          );

          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Price Alert: ${alert.symbol}`, {
              body: `${alert.symbol} is now ${alert.condition} $${alert.price}. Current price: $${currentPrice.toFixed(2)}`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    }
  }, [currentPrice, alerts]);

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleAddAlert = (e) => {
    e.preventDefault();
    if (!newAlert.price || parseFloat(newAlert.price) <= 0) return;

    const alert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol.toUpperCase(),
      condition: newAlert.condition,
      price: parseFloat(newAlert.price),
      createdAt: new Date().toISOString(),
      triggered: false
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ symbol: symbol || 'SPY', condition: 'above', price: '' });
    setShowAddForm(false);

    requestNotificationPermission();
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-yellow-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>Price Alerts</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Alert
        </button>
      </div>

      {/* Add Alert Form */}
      {showAddForm && (
        <form onSubmit={handleAddAlert} className={`mb-6 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Symbol"
              value={newAlert.symbol}
              onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
              className={`px-3 py-2 ${inputBg} border ${borderColor} rounded ${textPrimary}`}
              required
            />
            <select
              value={newAlert.condition}
              onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
              className={`px-3 py-2 ${inputBg} border ${borderColor} rounded ${textPrimary}`}
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newAlert.price}
              onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
              className={`px-3 py-2 ${inputBg} border ${borderColor} rounded ${textPrimary}`}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Notification Permission */}
      {'Notification' in window && Notification.permission === 'default' && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg">
          <p className={`text-sm ${textSecondary}`}>
            <button
              onClick={requestNotificationPermission}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Enable notifications
            </button>
            {' '}to get alerts when prices trigger.
          </p>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-4">
          <h4 className={`font-semibold ${textPrimary} mb-3`}>Active Alerts ({activeAlerts.length})</h4>
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div key={alert.id} className={`flex items-center justify-between p-3 border ${borderColor} rounded-lg`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    alert.condition === 'above'
                      ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-20'
                      : 'bg-red-100 dark:bg-red-900 dark:bg-opacity-20'
                  }`}>
                    {alert.condition === 'above' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${textPrimary}`}>
                      {alert.symbol} {alert.condition} ${alert.price.toFixed(2)}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>
                      Created {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className={`${textSecondary} hover:text-red-600`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div>
          <h4 className={`font-semibold ${textPrimary} mb-3`}>Triggered Alerts ({triggeredAlerts.length})</h4>
          <div className="space-y-2">
            {triggeredAlerts.map(alert => (
              <div key={alert.id} className={`flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border ${borderColor} rounded-lg`}>
                <div>
                  <p className={`font-semibold ${textPrimary}`}>
                    ✓ {alert.symbol} reached ${alert.price.toFixed(2)}
                  </p>
                  <p className={`text-xs ${textSecondary}`}>
                    Triggered {new Date(alert.triggeredAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className={`${textSecondary} hover:text-red-600`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <p className={textSecondary}>
          No alerts set. Create alerts to get notified when stock prices reach your targets!
        </p>
      )}
    </div>
  );
}

export default AlertsPanel;
