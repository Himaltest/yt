import React, { useEffect, useRef } from 'react';
import { DownloadJob } from '../types';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Music,
  Video,
  RefreshCw,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

interface DownloadModalProps {
  job: DownloadJob | null;
  videoTitle: string;
  thumbnail: string;
  onClose: () => void;
  onRetry: () => void;
  onOpenCookies?: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  job,
  videoTitle,
  thumbnail,
  onClose,
  onRetry,
  onOpenCookies,
}) => {
  const downloadTriggeredRef = useRef(false);

  useEffect(() => {
    if (job?.status === 'ready' && !downloadTriggeredRef.current) {
      downloadTriggeredRef.current = true;
      const downloadUrl = `/api/download/file/${job.id}`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = job.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [job?.status, job?.id, job?.filename]);

  if (!job) return null;

  const isAudio =
    job.filename.endsWith('.mp3') ||
    job.filename.endsWith('.m4a') ||
    job.filename.endsWith('.opus');

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isAuthRequired =
    job.status === 'error' &&
    (job.botProtected ||
      job.error?.toLowerCase().includes('bot') ||
      job.error?.toLowerCase().includes('authenticat'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Media Preview Header */}
        <div className="flex items-center gap-3.5 pr-8 mb-5">
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img
              src={thumbnail}
              alt={videoTitle}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/70 text-[10px] text-white">
              {isAudio ? <Music className="h-3 w-3" /> : <Video className="h-3 w-3" />}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={videoTitle}>
              {videoTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
              {job.filename}
            </p>
          </div>
        </div>

        {/* Status Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {job.status === 'downloading' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                  Downloading streams on NovaTube...
                </>
              )}
              {job.status === 'processing' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                  Encoding & Muxing with FFmpeg...
                </>
              )}
              {job.status === 'ready' && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Download Complete!</span>
                </>
              )}
              {job.status === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    {isAuthRequired ? 'YouTube Authentication Needed' : 'Download Error'}
                  </span>
                </>
              )}
              {job.status === 'initializing' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                  Initializing stream pipeline...
                </>
              )}
            </span>

            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              {job.progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                job.status === 'error'
                  ? 'bg-rose-500'
                  : job.status === 'ready'
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${job.progress}%` }}
            />
          </div>

          {/* Details Row */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>
              {job.status === 'ready' ? formatSize(job.fileSize) : job.speed}
            </span>
            <span>
              {job.status === 'ready' ? 'Direct download initiated' : `ETA: ${job.eta}`}
            </span>
          </div>
        </div>

        {/* Authentication Notice if YouTube requires cookies */}
        {isAuthRequired && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 mb-5 dark:border-rose-900/50 dark:bg-rose-950/40 text-xs">
            <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-300 leading-relaxed mb-3">
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 dark:text-rose-200 mb-1">
                  YouTube Viewer Verification Required
                </p>
                <p>
                  YouTube requires viewer authentication for cloud servers on this specific video. Paste your YouTube session cookies once to download this video directly from NovaTube in 4K or 320 kbps MP3.
                </p>
              </div>
            </div>

            {onOpenCookies && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCookies();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-md transition-colors"
              >
                <KeyRound className="h-4 w-4" />
                <span>Paste YouTube Cookies (1-Click Setup)</span>
              </button>
            )}
          </div>
        )}

        {/* Generic Error Block */}
        {job.status === 'error' && !isAuthRequired && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 mb-5 dark:border-rose-900/50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-300">
            <p className="font-bold mb-1">Download Error</p>
            <p>{job.error || 'Failed to download format. Please retry or choose another quality.'}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {job.status === 'ready' ? (
            <>
              <a
                href={`/api/download/file/${job.id}`}
                download={job.filename}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 shadow-lg shadow-emerald-900/30"
              >
                <Download className="h-4 w-4" />
                <span>Save File Again</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
              >
                Done
              </button>
            </>
          ) : job.status === 'error' ? (
            <>
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Download</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              Run in Background
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
