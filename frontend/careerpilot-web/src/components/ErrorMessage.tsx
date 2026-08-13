import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
      <div className="flex items-center space-x-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 text-red-400 hover:text-red-600 focus:outline-none font-bold"
        >
          ×
        </button>
      )}
    </div>
  );
};
