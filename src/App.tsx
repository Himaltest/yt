import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VideoDetail } from './components/VideoDetail';
import { DownloadModal } from './components/DownloadModal';
import { CookieModal } from './components/CookieModal';
import { FeaturesSection } from './components/FeaturesSection';
import { Footer } from './components/Footer';
import { VideoInfo, DownloadJob, DownloadHistoryItem } from './types';
import {
  Search,
  ClipboardPaste,
  X,
  Loader2,
  AlertCircle,
  Download,
  Sparkles,
  History,
  Trash2,
  Music,
  Video,
  KeyRound,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

const SAMPLES = [
  {
    title: 'Rick Astley - Never Gonna Give You Up (4K)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
];

export default function App() {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isBotProtectedError, setIsBotProtectedError] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [activeJob, setActiveJob] = useState<DownloadJob | null>(null);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [lastDownloadParams, setLastDownloadParams] = useState<any>(null);

  // Cookie management for YouTube Bot Bypass
  const [cookies, setCookies] = useState<string>('');
  const [cookieModalOpen, setCookieModalOpen] = useState<boolean>(false);

  // Load history & cookies from localStorage
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem('novatube_history');
      if (savedHist) setHistory(JSON.parse(savedHist));

      const savedCook = localStorage.getItem('novatube_cookies');
      if (savedCook) setCookies(savedCook);
    } catch {
      // Ignore
    }
  }, []);

  const handleSaveCookies = (newCookies: string) => {
    const trimmed = newCookies.trim();
    setCookies(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('novatube_cookies', trimmed);
      } else {
        localStorage.removeItem('novatube_cookies');
      }
    } catch {
      // Ignore
    }
    // If there is an active url, re-fetch with new cookies
    if (url.trim()) {
      handleFetchInfo(url, trimmed);
    }
  };

  const handleClearCookies = () => {
    setCookies('');
    try {
      localStorage.removeItem('novatube_cookies');
    } catch {
      // Ignore
    }
  };

  const saveHistory = (item: DownloadHistoryItem) => {
    const updated = [item, ...history.filter((h) => h.id !== item.id || h.quality !== item.quality)].slice(0, 8);
    setHistory(updated);
    try {
      localStorage.setItem('novatube_history', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('novatube_history');
    } catch {
      // Ignore
    }
  };

  // Dark mode class toggle on root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch video information
  const handleFetchInfo = async (targetUrl?: string, overrideCookies?: string) => {
    const queryUrl = targetUrl || url;
    if (!queryUrl.trim()) {
      setError('Please enter or paste a valid YouTube video link.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsBotProtectedError(false);

    const activeCookieStr = overrideCookies !== undefined ? overrideCookies : cookies;

    try {
      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: queryUrl.trim(),
          cookies: activeCookieStr || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.botProtected) {
          setIsBotProtectedError(true);
        }
        throw new Error(data.error || 'Failed to fetch video information.');
      }

      setVideoInfo(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Paste from clipboard handler
  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text);
          handleFetchInfo(text);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  // Initiate download task
  const handleDownload = async (params: {
    type: 'video' | 'audio';
    height?: number;
    audioBitrate?: number;
    format: string;
    startTime?: string;
    endTime?: string;
  }) => {
    if (!videoInfo) return;

    setLastDownloadParams(params);
    setError(null);

    const payload = {
      url: `https://www.youtube.com/watch?v=${videoInfo.id}`,
      type: params.type,
      height: params.height,
      audioBitrate: params.audioBitrate,
      format: params.format,
      startTime: params.startTime,
      endTime: params.endTime,
      title: videoInfo.title,
      cookies: cookies || undefined,
    };

    try {
      const response = await fetch('/api/download/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start download.');
      }

      const newJob: DownloadJob = {
        id: data.jobId,
        status: 'downloading',
        progress: 10,
        speed: 'Connecting...',
        eta: '--:--',
        filename: data.filename,
      };

      setActiveJob(newJob);

      saveHistory({
        id: videoInfo.id,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        channel: videoInfo.channel,
        type: params.type,
        quality: params.type === 'video' ? `${params.height}p` : `${params.audioBitrate} kbps MP3`,
        filename: data.filename,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start download task.');
    }
  };

  // Poll active download job
  useEffect(() => {
    if (!activeJob || activeJob.status === 'ready' || activeJob.status === 'error') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/download/status/${activeJob.id}`);
        if (!res.ok) return;
        const jobData = await res.json();
        setActiveJob((prev) => (prev ? { ...prev, ...jobData } : null));
      } catch (err) {
        console.warn('Poll status error:', err);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors selection:bg-rose-500/30 selection:text-rose-600 dark:selection:text-rose-200">
      {/* Top Navigation */}
      <Header
        darkMode={darkMode}
        hasCookies={Boolean(cookies)}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onOpenCookies={() => setCookieModalOpen(true)}
        onSampleClick={() => {
          const sample = SAMPLES[0];
          setUrl(sample.url);
          handleFetchInfo(sample.url);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero & Input Section */}
        <section id="downloader" className="max-w-4xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast, Server-Side 4K & MP3 Conversion</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Download YouTube Videos & <span className="text-rose-600 dark:text-rose-500">320kbps MP3s</span>
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Paste any YouTube video or Shorts URL. Choose from 4K, 1440p, 1080p Full HD MP4 video or studio-quality 320 kbps MP3 audio with custom trimming.
          </p>

          {/* Search / Paste Input Box */}
          <div className="mt-8 relative max-w-2xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFetchInfo();
              }}
              className="relative flex items-center rounded-2xl border border-slate-300 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900/90 transition-all focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20"
            >
              <div className="pl-3 pr-2 text-slate-400 dark:text-slate-500">
                <Search className="h-5 w-5" />
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube link here (e.g. https://www.youtube.com/watch?v=...)"
                className="w-full bg-transparent px-2 py-2 text-sm text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-slate-500 focus:outline-none"
              />

              <div className="flex items-center gap-1.5 pr-1 shrink-0">
                {url ? (
                  <button
                    type="button"
                    onClick={() => {
                      setUrl('');
                      setError(null);
                      setIsBotProtectedError(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Clear input"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                    <span>Paste</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-950/20 transition-colors hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Fetch</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Sample Links & Cookie Status Strip */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Verified Sample:</span>
                {SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUrl(s.url);
                      handleFetchInfo(s.url);
                    }}
                    className="rounded-md bg-white border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white transition-colors"
                  >
                    {s.title}
                  </button>
                ))}
              </div>

              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>

              <button
                type="button"
                onClick={() => setCookieModalOpen(true)}
                className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>
                  {cookies ? 'Cookies Configured (Active)' : 'Paste YouTube Cookies (Bot Bypass)'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Error Alert Box with Bot Protection Recovery */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 rounded-xl border border-rose-300 bg-rose-50 p-4.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                  {isBotProtectedError ? 'YouTube Bot Verification Required' : 'Unable to process video'}
                </p>
                <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                  {error}
                </p>

                {isBotProtectedError && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-2.5 pt-3 border-t border-rose-200 dark:border-rose-900/60">
                    <button
                      type="button"
                      onClick={() => setCookieModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-xs transition-colors"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Configure Cookies to Bypass</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const sample = SAMPLES[0];
                        setUrl(sample.url);
                        handleFetchInfo(sample.url);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                      <span>Test Verified 4K Video</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setError(null);
                  setIsBotProtectedError(false);
                }}
                className="text-rose-500 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 p-1"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center animate-pulse shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Analyzing video streams & formats...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Extracting resolutions up to 4K and audio bitrates up to 320 kbps.
            </p>
          </div>
        )}

        {/* Video Detail & Download Hub */}
        {videoInfo && !loading && (
          <div className="max-w-5xl mx-auto mb-16 animate-fadeIn">
            <VideoDetail
              info={videoInfo}
              hasCookies={Boolean(cookies)}
              onOpenCookies={() => setCookieModalOpen(true)}
              onDownload={handleDownload}
            />
          </div>
        )}

        {/* Session Download History */}
        {history.length > 0 && (
          <section className="max-w-5xl mx-auto mt-12 mb-16">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Downloads in this Session</h3>
              </div>
              <button
                type="button"
                onClick={clearHistory}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear history</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {history.map((item, idx) => (
                <div
                  key={`${item.id}-${item.quality}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-12 w-16 rounded-md object-cover bg-slate-100 dark:bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={item.title}>
                      {item.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.type === 'video' ? (
                        <Video className="h-3 w-3 text-rose-500 dark:text-rose-400 shrink-0" />
                      ) : (
                        <Music className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                      )}
                      <span>{item.quality}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features & FAQ */}
        <FeaturesSection />
      </main>

      {/* Live Download Modal */}
      <DownloadModal
        job={activeJob}
        videoTitle={videoInfo?.title || 'YouTube Media'}
        thumbnail={videoInfo?.thumbnail || ''}
        onClose={() => setActiveJob(null)}
        onRetry={() => {
          if (lastDownloadParams) {
            handleDownload(lastDownloadParams);
          }
        }}
        onOpenCookies={() => setCookieModalOpen(true)}
      />

      {/* Cookie Setup Modal */}
      <CookieModal
        isOpen={cookieModalOpen}
        savedCookies={cookies}
        onSave={handleSaveCookies}
        onClear={handleClearCookies}
        onClose={() => setCookieModalOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
