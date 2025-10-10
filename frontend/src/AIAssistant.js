import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';

function AIAssistant({ darkMode, symbol, prediction, isOpen, setIsOpen }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const open = isOpen !== undefined ? isOpen : internalIsOpen;
  const setOpen = setIsOpen !== undefined ? setIsOpen : setInternalIsOpen;
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI trading assistant. Ask me about stock analysis, trading strategies, or technical indicators!"
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode ? 'bg-gray-700' : 'bg-gray-100';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    // Context-aware responses based on current prediction
    if (prediction && (message.includes(symbol?.toLowerCase()) || message.includes('current') || message.includes('this stock'))) {
      return `Based on the current analysis, ${symbol} has a ${prediction.prediction} prediction with ${prediction.confidence.toFixed(1)}% confidence. The current price is $${prediction.current_price.toFixed(2)}. The model analyzed 30+ technical indicators including RSI, MACD, Bollinger Bands, and moving averages to make this prediction. Remember, this is educational only and not financial advice.`;
    }

    // General questions
    if (message.includes('rsi') || message.includes('relative strength')) {
      return "RSI (Relative Strength Index) measures momentum on a scale of 0-100. Above 70 is considered overbought (potential sell signal), below 30 is oversold (potential buy signal). It's one of 30 indicators our model uses.";
    }

    if (message.includes('macd')) {
      return "MACD (Moving Average Convergence Divergence) shows the relationship between two moving averages. When MACD crosses above the signal line, it's bullish. When it crosses below, it's bearish. Our model uses MACD as one of its momentum indicators.";
    }

    if (message.includes('bollinger') || message.includes('bands')) {
      return "Bollinger Bands show volatility and potential price levels. The bands widen during high volatility and narrow during low volatility. Prices touching the upper band may be overbought, while touching the lower band may be oversold.";
    }

    if (message.includes('moving average') || message.includes('sma') || message.includes('ema')) {
      return "Moving averages smooth price data to identify trends. SMA (Simple) gives equal weight to all prices, while EMA (Exponential) gives more weight to recent prices. Our model uses 5, 20, and 50-day SMAs and 12/26-day EMAs.";
    }

    if (message.includes('how') && (message.includes('model') || message.includes('work') || message.includes('predict'))) {
      return "Our prediction model uses a Random Forest algorithm trained on historical data. It analyzes 30+ technical indicators including momentum (RSI, MACD), moving averages, volatility (Bollinger Bands, ATR), and volume indicators. The model achieves ~52% accuracy, slightly better than random chance. Always do your own research!";
    }

    if (message.includes('accuracy') || message.includes('reliable') || message.includes('trust')) {
      return "The model has ~51.88% accuracy on test data, which is only slightly better than a coin flip (50%). Stock markets are extremely difficult to predict. Use this tool for educational purposes only. Never invest real money based solely on these predictions. Always consult financial advisors.";
    }

    if (message.includes('buy') || message.includes('sell') || message.includes('should i')) {
      return "I cannot provide financial advice. This tool is for educational purposes only. The predictions show what the model thinks based on technical indicators, but they should NOT be used as investment advice. Always do thorough research, understand your risk tolerance, and consult licensed financial advisors before making investment decisions.";
    }

    if (message.includes('strategy') || message.includes('trade')) {
      return "Common trading strategies include: 1) Trend Following - trade in the direction of the trend, 2) Mean Reversion - bet prices will return to average, 3) Breakout Trading - trade when price breaks key levels, 4) Risk Management - always use stop losses and position sizing. Remember: No strategy guarantees profits!";
    }

    if (message.includes('risk') || message.includes('safe')) {
      return "Risk management is crucial! Key principles: 1) Never invest more than you can afford to lose, 2) Diversify your portfolio, 3) Use stop-loss orders, 4) Don't risk more than 1-2% per trade, 5) Understand that all trading involves risk. Past performance doesn't guarantee future results.";
    }

    if (message.includes('portfolio') || message.includes('diversif')) {
      return "Diversification means spreading investments across different assets to reduce risk. Consider diversifying across: sectors (tech, healthcare, finance), asset classes (stocks, bonds, commodities), and geographies. The portfolio tracker in this app can help monitor your holdings!";
    }

    if (message.includes('volatility') || message.includes('atr')) {
      return "Volatility measures how much a stock's price fluctuates. ATR (Average True Range) quantifies volatility. High volatility means larger price swings (higher risk/reward), while low volatility means steadier prices. Our model uses ATR and Bollinger Bands to measure volatility.";
    }

    if (message.includes('volume') || message.includes('obv')) {
      return "Volume shows how many shares are traded. High volume with price increase suggests strong buying pressure. OBV (On-Balance Volume) and MFI (Money Flow Index) are volume-based indicators that help confirm price trends. Our model analyzes these as part of its 30 features.";
    }

    if (message.includes('help') || message.includes('what can you')) {
      return "I can help you understand:\n• Technical indicators (RSI, MACD, Bollinger Bands, etc.)\n• How the prediction model works\n• Trading strategies and risk management\n• Portfolio diversification\n• General stock market concepts\n\nJust ask me anything about stocks or trading!";
    }

    // Default response
    return "That's an interesting question! I can help with technical analysis, trading concepts, and how our model works. Try asking about specific indicators (RSI, MACD), trading strategies, risk management, or how the prediction model operates. What would you like to know?";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: getAIResponse(input)
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button - Hidden on mobile (md:block) */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:block fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-40"
        title="AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {open && (
        <div className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] ${cardBg} rounded-lg shadow-2xl z-50 flex flex-col`}
             style={{ height: '500px', maxHeight: 'calc(100vh - 8rem)' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              <h3 className={`font-bold ${textPrimary}`}>AI Trading Assistant</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className={`${textSecondary} hover:${textPrimary}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : `${inputBg} ${textPrimary}`
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-300 dark:border-gray-600">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className={`flex-1 px-4 py-2 ${inputBg} border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 ${textPrimary}`}
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className={`text-xs ${textSecondary} mt-2`}>
              AI assistant for educational purposes only
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistant;
