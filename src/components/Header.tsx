import React from 'react';
import { Download, Sun, Moon, Sparkles, KeyRound, Check } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  hasCookies: boolean;
  onToggleTheme: () => void;
  onSampleClick: () => void;
  onOpenCookies: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  hasCookies,
  onToggleTheme,
  onSampleClick,
  onOpenCookies,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark (Single text element in display style) */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-lg shadow-rose-600/25">
            <Download className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Nova<span className="text-rose-500">Tube</span>
          </span>
        </a>

        {/* Zone 2: 4 Navigation Links (Single line, text-only with subtle hover) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a
            href="#downloader"
            className="transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Downloader
          </a>
          <a
            href="#formats"
            className="transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Formats & Bitrates
          </a>
          <a
            href="#trimmer"
            className="transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            Trim & Clip
          </a>
          <a
            href="#faq"
            className="transition-colors hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0"
          >
            FAQ
          </a>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenCookies}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              hasCookies
                ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            title="Configure YouTube session cookie to bypass bot check"
          >
            {hasCookies ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cookies Active</span>
              </>
            ) : (
              <>
                <KeyRound className="h-3.5 w-3.5 text-rose-500" />
                <span>Bot Bypass</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSampleClick}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
            title="Load sample video to test immediately"
          >
            <Sparkles className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
            <span>Load Sample</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
