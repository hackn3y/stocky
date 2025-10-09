import React, { useState } from 'react';
import { Menu, X, Home, BarChart3, TrendingUp, Award, Bell, Users, DollarSign, MessageSquare, Info } from 'lucide-react';

function MobileNav({ darkMode, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard' },
    { icon: TrendingUp, label: 'Technical Charts', id: 'technical' },
    { icon: DollarSign, label: 'Paper Trading', id: 'trading' },
    { icon: Award, label: 'Performance', id: 'performance' },
    { icon: Users, label: 'Social Feed', id: 'social' },
    { icon: BarChart3, label: 'Backtesting', id: 'backtesting' },
    { icon: Bell, label: 'Alerts', id: 'alerts' },
    { icon: MessageSquare, label: 'AI Assistant', id: 'ai' },
    { icon: Info, label: 'How It Works', id: 'info' }
  ];

  const handleItemClick = (id) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(id);
    }

    // Scroll to section
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-80 ${cardBg} shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${textPrimary}`}>Navigation</h2>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${textSecondary}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-88px)]">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-200'
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <item.icon className="h-5 w-5 text-indigo-600" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className={`text-xs font-semibold ${textSecondary} mb-3 uppercase`}>
              Quick Actions
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                  darkMode
                    ? 'bg-indigo-900 bg-opacity-20 text-indigo-400'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                Back to Top
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${cardBg} border-t border-gray-200 dark:border-gray-700 z-30`}>
        <div className="flex items-center justify-around py-2">
          {[
            { icon: Home, id: 'dashboard' },
            { icon: TrendingUp, id: 'technical' },
            { icon: DollarSign, id: 'trading' },
            { icon: Award, id: 'performance' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${textSecondary} hover:text-indigo-600 transition-colors`}
            >
              <item.icon className="h-6 w-6" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default MobileNav;
