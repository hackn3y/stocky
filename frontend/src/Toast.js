import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900 dark:bg-opacity-20 dark:border-green-700 dark:text-green-300',
    error: 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900 dark:bg-opacity-20 dark:border-red-700 dark:text-red-300',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-20 dark:border-yellow-700 dark:text-yellow-300',
    info: 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900 dark:bg-opacity-20 dark:border-blue-700 dark:text-blue-300'
  };

  const iconColors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  };

  const Icon = icons[type];

  return (
    <div className={`${colors[type]} border-l-4 p-4 rounded-lg shadow-lg flex items-start gap-3 min-w-[300px] max-w-md animate-slide-in`}>
      <Icon className={`h-5 w-5 ${iconColors[type]} flex-shrink-0 mt-0.5`} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-[60] space-y-2 pointer-events-none">
      <div className="pointer-events-auto space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </div>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}

export default Toast;
