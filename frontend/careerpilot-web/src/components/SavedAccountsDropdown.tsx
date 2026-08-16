import React, { useState, useEffect } from 'react';
import { Key, UserCheck, Trash2, Zap } from 'lucide-react';

export interface SavedAccount {
  email: string;
  password?: string;
  fullName?: string;
  lastUsed?: string;
}

const DEFAULT_DEMO_ACCOUNTS: SavedAccount[] = [
  { email: 'manjunatha@gmail.com', password: 'Password123!', fullName: 'Manjunatha (Candidate)', lastUsed: 'Just now' },
  { email: 'tejj@gmail.com', password: 'Password123!', fullName: 'Tej (Developer)', lastUsed: 'Recently' },
  { email: 'tester@gmail.com', password: 'Password123!', fullName: 'QA Tester', lastUsed: 'Recently' },
  { email: 'demo@careerpilot.ai', password: 'Password123!', fullName: 'Demo Candidate', lastUsed: 'Recently' },
];

const STORAGE_KEY = 'careerpilot_saved_accounts';

export const getSavedAccounts = (): SavedAccount[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved accounts', e);
  }
  return DEFAULT_DEMO_ACCOUNTS;
};

export const saveAccountCredentials = (email: string, password?: string, fullName?: string) => {
  if (!email) return;
  try {
    const existing = getSavedAccounts();
    const filtered = existing.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    const updated: SavedAccount[] = [
      {
        email,
        password: password || 'Password123!',
        fullName: fullName || email.split('@')[0],
        lastUsed: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...filtered,
    ].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save account credentials', e);
  }
};

interface Props {
  onSelectAccount: (email: string, password: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onQuickLogin?: (email: string, password: string) => void;
}

export const SavedAccountsDropdown: React.FC<Props> = ({
  onSelectAccount,
  isOpen,
  onClose,
  onQuickLogin,
}) => {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);

  useEffect(() => {
    setAccounts(getSavedAccounts());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteAccount = (e: React.MouseEvent, emailToDelete: string) => {
    e.stopPropagation();
    const updated = accounts.filter((a) => a.email.toLowerCase() !== emailToDelete.toLowerCase());
    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-surface-900 border border-surface-700 text-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-3 bg-surface-800/80 border-b border-surface-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-surface-300">
            Saved Accounts & Credentials
          </span>
        </div>
        <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-mono">
          Auto-Fill Ready
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto divide-y divide-surface-800">
        {accounts.map((acc) => (
          <div
            key={acc.email}
            onClick={() => {
              onSelectAccount(acc.email, acc.password || 'Password123!');
              if (onQuickLogin) {
                onQuickLogin(acc.email, acc.password || 'Password123!');
              }
              onClose();
            }}
            className="p-3 hover:bg-surface-800 transition-colors cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-all">
                <Zap className="w-4 h-4 text-brand-400 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-surface-100 truncate group-hover:text-brand-300">
                  {acc.email}
                </div>
                <div className="text-[11px] text-surface-400 font-mono flex items-center space-x-1">
                  <span>••••••••••••</span>
                  {acc.fullName && <span className="text-surface-500 truncate">({acc.fullName})</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100">
              <button
                type="button"
                title="Select & Auto-fill"
                className="px-2 py-1 bg-brand-500/20 hover:bg-brand-500 text-brand-300 hover:text-white text-[10px] font-bold rounded-lg transition-all"
              >
                Use
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteAccount(e, acc.email)}
                title="Remove from saved accounts"
                className="p-1 text-surface-500 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2.5 bg-surface-950 border-t border-surface-800 text-center">
        <button
          type="button"
          onClick={() => {
            const first = accounts[0] || DEFAULT_DEMO_ACCOUNTS[0];
            onSelectAccount(first.email, first.password || 'Password123!');
            if (onQuickLogin) {
              onQuickLogin(first.email, first.password || 'Password123!');
            }
            onClose();
          }}
          className="w-full py-1.5 px-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>1-Click Sign In as {accounts[0]?.email || 'manjunatha@gmail.com'}</span>
        </button>
      </div>
    </div>
  );
};
