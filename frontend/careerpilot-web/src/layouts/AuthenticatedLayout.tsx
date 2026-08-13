import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, User, Briefcase, Brain, FileCheck, FileText, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Badge } from '../components/Badge';
import { PlatformChatbotWidget } from '../components/PlatformChatbotWidget';

export const AuthenticatedLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: Array<{ name: string; path: string; icon: any; enabled: boolean; badge?: string }> = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, enabled: true },
    { name: 'Resume', path: '/resume', icon: FileText, enabled: true },
    { name: 'Jobs', path: '/jobs', icon: Briefcase, enabled: true },
    { name: 'Career Intelligence', path: '/career-intelligence', icon: Brain, enabled: true },
    { name: 'Applications', path: '/applications', icon: FileCheck, enabled: true },
    { name: 'Settings', path: '/settings', icon: Settings, enabled: true },
  ];

  return (
    <div className="min-h-screen flex bg-surface-50 text-surface-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-surface-200 bg-white flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-surface-100 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
              CP
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-surface-900">
                CareerPilot <span className="text-brand-500">AI</span>
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (!item.enabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-surface-400 bg-surface-50 cursor-not-allowed opacity-75"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && <Badge variant="surface">{item.badge}</Badge>}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-500 text-white font-semibold shadow-md shadow-brand-500/20'
                        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && <Badge variant="brand">{item.badge}</Badge>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card */}
        <div className="p-4 border-t border-surface-100">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-surface-900 truncate">{user?.fullName || 'Candidate'}</p>
                <p className="text-[10px] text-surface-500 capitalize">{user?.role || 'candidate'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-surface-200 bg-white flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <Badge variant="brand" className="hidden sm:inline-flex">
              Candidate Portal
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            {/* Top Right Profile Dropdown Module */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-3 p-1.5 pr-3 rounded-full hover:bg-surface-100 border border-surface-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {user?.fullName?.charAt(0).toUpperCase() || 'M'}
                </div>
                <span className="text-xs font-bold text-surface-800 hidden sm:inline-block">
                  {user?.fullName || 'manju'}
                </span>
                <ChevronDown className="w-4 h-4 text-surface-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-surface-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-surface-100">
                    <p className="text-xs font-bold text-surface-900">{user?.fullName || 'Manju'}</p>
                    <p className="text-[11px] text-surface-500 truncate">{user?.email || 'manju@example.com'}</p>
                  </div>

                  <div className="py-1">
                    <NavLink
                      to="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-xs font-medium text-surface-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Edit Candidate Profile</span>
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-xs font-medium text-surface-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Account Settings</span>
                    </NavLink>
                  </div>

                  <div className="border-t border-surface-100 pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto bg-surface-50 p-6">
          <Outlet />
        </main>
      </div>

      {/* Global Floating Platform Support Chatbot Assistant */}
      <PlatformChatbotWidget />
    </div>
  );
};
