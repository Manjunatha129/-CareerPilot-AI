import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { ShieldCheck, User, Mail, Server } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-surface-200 pb-4">
        <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Account & System Settings</h1>
        <p className="text-sm text-surface-500">Manage security details and system environment preferences</p>
      </div>

      <div className="bg-white border border-surface-200 rounded-2xl p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" /> Account Security Credentials
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-500" /> Full Name
            </span>
            <p className="text-sm font-bold text-surface-900">{user?.fullName}</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-500" /> Email Address
            </span>
            <p className="text-sm font-bold text-surface-900">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" /> Account Role
            </span>
            <div>
              <Badge variant="brand">{user?.role || 'ROLE_CANDIDATE'}</Badge>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-1">
            <span className="text-xs font-semibold text-surface-500 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brand-500" /> Backend API Base URL
            </span>
            <p className="text-xs font-mono font-semibold text-surface-700 truncate">{apiBaseUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
