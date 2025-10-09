import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, ComposedChart } from 'recharts';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

function TechnicalChart({ historicalData, darkMode, symbol }) {
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    ema12: false,
    volume: true,
    rsi: false
  });

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  if (!historicalData || historicalData.length === 0) {
    return null;
  }

  // Calculate Simple Moving Average
  const calculateSMA = (data, period) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.price, 0);
        result.push(sum / period);
      }
    }
    return result;
  };

  // Calculate Exponential Moving Average
  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    const result = [];
    let ema = data[0].price;

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        result.push(data[i].price);
      } else {
        ema = (data[i].price * k) + (ema * (1 - k));
        result.push(ema);
      }
    }
    return result;
  };

  // Calculate RSI
  const calculateRSI = (data, period = 14) => {
    const result = [];
    const changes = [];

    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].price - data[i - 1].price);
    }

    for (let i = 0; i < changes.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const gains = changes.slice(i - period + 1, i + 1).filter(c => c > 0);
        const losses = changes.slice(i - period + 1, i + 1).filter(c => c < 0).map(c => Math.abs(c));

        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          const rsi = 100 - (100 / (1 + rs));
          result.push(rsi);
        }
      }
    }
    // Add null for the first data point (no change calculation)
    return [null, ...result];
  };

  // Prepare chart data with indicators
  const sma20 = indicators.sma20 ? calculateSMA(historicalData, 20) : [];
  const sma50 = indicators.sma50 ? calculateSMA(historicalData, 50) : [];
  const ema12 = indicators.ema12 ? calculateEMA(historicalData, 12) : [];
  const rsi = indicators.rsi ? calculateRSI(historicalData, 14) : [];

  const chartData = historicalData.map((item, idx) => ({
    ...item,
    sma20: sma20[idx],
    sma50: sma50[idx],
    ema12: ema12[idx],
    rsi: rsi[idx]
  }));

  // Toggle indicator
  const toggleIndicator = (indicator) => {
    setIndicators({ ...indicators, [indicator]: !indicators[indicator] });
  };

  return (
    <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h3 className={`text-xl font-bold ${textPrimary}`}>
            Technical Analysis - {symbol}
          </h3>
        </div>
      </div>

      {/* Indicator Toggles */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => toggleIndicator('sma20')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            indicators.sma20
              ? 'bg-blue-600 text-white'
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
          }`}
        >
          {indicators.sma20 ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          SMA 20
        </button>

        <button
          onClick={() => toggleIndicator('sma50')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            indicators.sma50
              ? 'bg-purple-600 text-white'
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
          }`}
        >
          {indicators.sma50 ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          SMA 50
        </button>

        <button
          onClick={() => toggleIndicator('ema12')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            indicators.ema12
              ? 'bg-green-600 text-white'
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
          }`}
        >
          {indicators.ema12 ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          EMA 12
        </button>

        <button
          onClick={() => toggleIndicator('volume')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            indicators.volume
              ? 'bg-orange-600 text-white'
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
          }`}
        >
          {indicators.volume ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Volume
        </button>

        <button
          onClick={() => toggleIndicator('rsi')}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            indicators.rsi
              ? 'bg-yellow-600 text-white'
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
          }`}
        >
          {indicators.rsi ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          RSI
        </button>
      </div>

      {/* Price Chart with Moving Averages */}
      <div className="mb-6">
        <h4 className={`text-sm font-semibold ${textPrimary} mb-2`}>Price & Moving Averages</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
              stroke={darkMode ? '#6B7280' : '#9CA3AF'}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
              stroke={darkMode ? '#6B7280' : '#9CA3AF'}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#374151' : 'white',
                color: darkMode ? '#F3F4F6' : '#1F2937',
                border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: darkMode ? '#F3F4F6' : '#1F2937' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={darkMode ? '#60A5FA' : '#3B82F6'}
              strokeWidth={2}
              dot={false}
              name="Price"
            />
            {indicators.sma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#818CF8"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
                name="SMA 20"
              />
            )}
            {indicators.sma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#A78BFA"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="5 5"
                name="SMA 50"
              />
            )}
            {indicators.ema12 && (
              <Line
                type="monotone"
                dataKey="ema12"
                stroke="#34D399"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="3 3"
                name="EMA 12"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      {indicators.volume && (
        <div className="mb-6">
          <h4 className={`text-sm font-semibold ${textPrimary} mb-2`}>Trading Volume</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                stroke={darkMode ? '#6B7280' : '#9CA3AF'}
              />
              <YAxis
                tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                stroke={darkMode ? '#6B7280' : '#9CA3AF'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? '#F3F4F6' : '#1F2937',
                  border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: darkMode ? '#F3F4F6' : '#1F2937' }}
                formatter={(value) => new Intl.NumberFormat().format(value)}
              />
              <Bar
                dataKey="volume"
                fill={darkMode ? '#F97316' : '#FB923C'}
                opacity={0.7}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI Chart */}
      {indicators.rsi && (
        <div>
          <h4 className={`text-sm font-semibold ${textPrimary} mb-2`}>Relative Strength Index (RSI)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                stroke={darkMode ? '#6B7280' : '#9CA3AF'}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 30, 50, 70, 100]}
                tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#374151' }}
                stroke={darkMode ? '#6B7280' : '#9CA3AF'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#374151' : 'white',
                  color: darkMode ? '#F3F4F6' : '#1F2937',
                  border: `1px solid ${darkMode ? '#4B5563' : '#D1D5DB'}`,
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: darkMode ? '#F3F4F6' : '#1F2937' }}
                formatter={(value) => value ? value.toFixed(2) : 'N/A'}
              />
              {/* Overbought/Oversold zones */}
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Overbought', fontSize: 10, fill: '#EF4444' }} />
              <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Oversold', fontSize: 10, fill: '#10B981' }} />
              <ReferenceLine y={50} stroke={darkMode ? '#6B7280' : '#9CA3AF'} strokeDasharray="1 1" />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke={darkMode ? '#FBBF24' : '#F59E0B'}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className={`mt-2 text-xs ${textSecondary} flex gap-4`}>
            <span>• RSI &gt; 70: Overbought</span>
            <span>• RSI &lt; 30: Oversold</span>
            <span>• RSI = 50: Neutral</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`mt-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg text-xs ${textSecondary}`}>
        <p className="font-semibold mb-1">Indicators Guide:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <p>• <strong>SMA (Simple Moving Average):</strong> Average price over period</p>
          <p>• <strong>EMA (Exponential Moving Average):</strong> Weighted average favoring recent prices</p>
          <p>• <strong>Volume:</strong> Number of shares traded</p>
          <p>• <strong>RSI:</strong> Momentum indicator (0-100 scale)</p>
        </div>
      </div>
    </div>
  );
}

export default TechnicalChart;
