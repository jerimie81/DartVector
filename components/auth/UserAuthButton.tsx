'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { LogIn, LogOut, Cloud, RefreshCw, CheckCircle2, User, Sparkles } from 'lucide-react';
import Image from 'next/image';

export const UserAuthButton: React.FC = () => {
  const { user, loading, signInWithGoogle, signOut, isSyncing, syncStatus, syncLocalToCloud } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-semibold animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden sm:inline">Connecting...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        id="google-sign-in-btn"
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black transition-all shadow-md active:scale-95 group"
        title="Sign in with Google to backup matches across devices"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span className="hidden sm:inline">Sign In</span>
        <span className="sm:hidden">Login</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Cloud status pill */}
      <button
        id="cloud-sync-trigger-btn"
        onClick={() => syncLocalToCloud()}
        disabled={isSyncing}
        className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
          isSyncing
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
        }`}
        title="Click to manually sync all local matches to Cloud"
      >
        {isSyncing ? (
          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
        ) : (
          <Cloud className="w-3 h-3 text-emerald-400" />
        )}
        <span>{syncStatus || (isSyncing ? 'Syncing...' : 'Cloud Synced')}</span>
      </button>

      {/* User profile dropdown trigger */}
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-xl">
        {user.photoURL ? (
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-amber-500/40">
            <Image
              src={user.photoURL}
              alt={user.displayName || 'Player'}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-xs font-black">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'P'}
          </div>
        )}

        <div className="flex flex-col text-left">
          <span className="text-xs font-black text-zinc-100 max-w-[90px] sm:max-w-[120px] truncate leading-tight">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <span className="text-[9px] text-amber-400 font-bold leading-tight flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Vault Active</span>
          </span>
        </div>

        <button
          id="auth-logout-btn"
          onClick={signOut}
          className="ml-1 p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
