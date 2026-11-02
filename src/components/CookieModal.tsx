import React, { useState } from 'react';
import { Shield, KeyRound, Check, X, Trash2, HelpCircle, AlertCircle, Copy } from 'lucide-react';

interface CookieModalProps {
  isOpen: boolean;
  savedCookies: string;
  onSave: (cookies: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const CookieModal: React.FC<CookieModalProps> = ({
  isOpen,
  savedCookies,
  onSave,
  onClear,
  onClose,
}) => {
  const [inputVal, setInputVal] = useState<string>(savedCookies);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyQuickScript = () => {
    navigator.clipboard.writeText('document.cookie');
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              YouTube Authentication & Bot-Check Bypass
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bypass "Sign in to confirm you're not a bot" on any video.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 mb-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 leading-relaxed">
          <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-rose-500" />
            <span>Why is this needed?</span>
          </p>
          YouTube strictly requires authentication for requests originating from cloud hosting servers. Providing your active session cookies authenticates your requests directly as a trusted browser viewer, enabling 4K video downloads and MP3 conversions for any video.
        </div>

        {/* Quick Instructions */}
        <div className="mb-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-semibold text-slate-900 dark:text-slate-300">
            How to get your cookies in 10 seconds:
          </p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Open <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="text-rose-600 dark:text-rose-400 underline">YouTube.com</a> in your browser.</li>
            <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">F12</kbd> (or right click → Inspect), go to the <strong>Console</strong> tab.</li>
            <li>
              Type{' '}
              <button
                type="button"
                onClick={handleCopyQuickScript}
                className="inline-flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-rose-600 dark:text-rose-400 hover:opacity-80"
                title="Click to copy"
              >
                <code>document.cookie</code>
                {copiedScript ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>{' '}
              and press Enter.
            </li>
            <li>Copy the output and paste it below (or paste exported <code className="font-mono text-[11px]">cookies.txt</code>).</li>
          </ol>
        </div>

        {/* Textarea Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Paste Cookie String or Netscape Content:
          </label>
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="VISITOR_INFO1_LIVE=...; YSC=...; PREF=...; SID=..."
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs font-mono text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            {savedCookies && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setInputVal('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Saved Cookies</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(inputVal);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-950/20 hover:bg-rose-500 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
