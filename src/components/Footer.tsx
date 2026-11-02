import React from 'react';
import { Download } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-white py-10 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-500 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-600/10 text-rose-600 dark:bg-rose-600/20 dark:text-rose-400">
            <Download className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-300">NovaTube</span>
          <span>· High-Fidelity Video & MP3 Engine</span>
        </div>

        <p className="text-center sm:text-right">
          For educational & personal backup purposes. Respect original creators and copyright laws.
        </p>
      </div>
    </footer>
  );
};
