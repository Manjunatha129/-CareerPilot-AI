import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface-50 text-surface-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-brand-500/20">
              CP
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-surface-900">
                CareerPilot <span className="text-brand-500">AI</span>
              </span>
            </div>
          </Link>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 shadow-sm transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-surface-700 hover:text-brand-500 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-surface-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-surface-500">
          CareerPilot AI © 2026 • Enterprise Multi-Agent AI Career Platform
        </div>
      </footer>
    </div>
  );
};
