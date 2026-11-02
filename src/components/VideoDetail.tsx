import React, { useState } from 'react';
import { VideoInfo } from '../types';
import {
  Video,
  Music,
  Scissors,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Play,
  Eye,
  Calendar,
  Clock,
  KeyRound,
} from 'lucide-react';

interface VideoDetailProps {
  info: VideoInfo;
  hasCookies: boolean;
  onOpenCookies: () => void;
  onDownload: (params: {
    type: 'video' | 'audio';
    height?: number;
    audioBitrate?: number;
    format: string;
    startTime?: string;
    endTime?: string;
  }) => void;
}

export const VideoDetail: React.FC<VideoDetailProps> = ({
  info,
  hasCookies,
  onOpenCookies,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'trim' | 'thumbnail'>('video');
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm'>('mp4');
  const [audioFormat, setAudioFormat] = useState<'mp3' | 'm4a'>('mp3');
  const [showEmbed, setShowEmbed] = useState<boolean>(false);

  // Trimming state
  const [startSec, setStartSec] = useState<number>(0);
  const [endSec, setEndSec] = useState<number>(Math.min(info.duration || 60, 60));
  const [trimType, setTrimType] = useState<'video' | 'audio'>('video');
  const [trimQuality, setTrimQuality] = useState<number>(1080);
  const [trimBitrate, setTrimBitrate] = useState<number>(320);

  const formatSecondsToTimestamp = (sec: number): string => {
    const s = Math.floor(sec);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (views: number): string => {
    if (!views) return 'Public Video';
    if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B views`;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views.toLocaleString()} views`;
  };

  const formatUploadDate = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 8) return dateStr || '';
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleStartTrimDownload = () => {
    const startStr = formatSecondsToTimestamp(startSec);
    const endStr = formatSecondsToTimestamp(endSec);

    if (trimType === 'video') {
      onDownload({
        type: 'video',
        height: trimQuality,
        format: 'mp4',
        startTime: startStr,
        endTime: endStr,
      });
    } else {
      onDownload({
        type: 'audio',
        audioBitrate: trimBitrate,
        format: 'mp3',
        startTime: startStr,
        endTime: endStr,
      });
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/95 transition-all">
      {/* Top Banner: Video Metadata & Preview */}
      <div className="p-5 sm:p-6 lg:p-7 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Thumbnail / Player Column */}
          <div className="lg:col-span-5">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-200 dark:border-slate-800 group shadow-md">
              {showEmbed ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${info.id}?autoplay=1`}
                  title={info.title}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src={info.thumbnail}
                    alt={info.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {info.durationString && (
                    <div className="absolute bottom-3 right-3 rounded-md bg-black/85 px-2 py-1 text-xs font-mono font-medium text-white backdrop-blur-xs">
                      {info.durationString}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowEmbed(true)}
                    className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-xl shadow-rose-900/40 backdrop-blur-xs transition-all hover:scale-110 hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    title="Watch preview inside app"
                  >
                    <Play className="h-6 w-6 fill-current translate-x-0.5" />
                  </button>
                </>
              )}
            </div>

            {showEmbed && (
              <button
                type="button"
                onClick={() => setShowEmbed(false)}
                className="mt-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Hide player preview
              </button>
            )}
          </div>

          {/* Video Info Column */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                {info.title}
              </h2>

              <div className="mt-2.5 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                {info.channelUrl ? (
                  <a
                    href={info.channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:underline transition-colors"
                  >
                    <span>{info.channel}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">{info.channel}</span>
                )}
              </div>

              {/* Zero-Pill Metadata Strip */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{info.durationString}</span>
                </span>
                <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{formatViewCount(info.viewCount)}</span>
                </span>
                {info.uploadDate && (
                  <>
                    <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatUploadDate(info.uploadDate)}</span>
                    </span>
                  </>
                )}
              </div>

              {info.description && (
                <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {info.description}
                </p>
              )}
            </div>

            {/* Quick action: high quality one-click suggestions */}
            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quick Download:</span>
              <button
                type="button"
                onClick={() => {
                  const bestVideo = info.videoOptions.find((v) => v.recommended) || info.videoOptions[0];
                  onDownload({
                    type: 'video',
                    height: bestVideo ? bestVideo.height : 1080,
                    format: 'mp4',
                  });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-950/20 hover:bg-rose-500 transition-colors"
              >
                <Video className="h-3.5 w-3.5" />
                <span>
                  {info.videoOptions.find((v) => v.recommended)?.label || '1080p MP4'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDownload({
                    type: 'audio',
                    audioBitrate: 320,
                    format: 'mp3',
                  });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
              >
                <Music className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                <span>320 kbps MP3</span>
              </button>

              {!hasCookies && (
                <button
                  type="button"
                  onClick={onOpenCookies}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors ml-auto"
                >
                  <KeyRound className="h-3.5 w-3.5 text-rose-500" />
                  <span>Bot Bypass Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 px-5 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-3 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'video'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Video (MP4 / WEBM)</span>
            <span className="font-mono text-[10px] opacity-75">
              ({info.videoOptions.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'audio'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>Audio & MP3</span>
            <span className="font-mono text-[10px] opacity-75">(4 Bitrates)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trim')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'trim'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span>Trim & Cut Clip</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thumbnail')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'thumbnail'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Thumbnail</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-5 sm:p-6 lg:p-7">
        {/* 1. Video Options Tab */}
        {activeTab === 'video' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Video Quality Options</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-definition video streams downloaded directly from NovaTube with synchronized audio.
                </p>
              </div>

              {/* Format selection */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setVideoFormat('mp4')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    videoFormat === 'mp4'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  MP4 (Universal)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoFormat('webm')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    videoFormat === 'webm'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  WEBM
                </button>
              </div>
            </div>

            {/* Video Qualities List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {info.videoOptions.map((opt) => (
                <div
                  key={opt.height}
                  className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    opt.recommended
                      ? 'border-rose-400/80 bg-rose-50/50 shadow-xs dark:border-rose-500/50 dark:bg-rose-950/15'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {opt.label}
                        {opt.recommended && (
                          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                            ★ Recommended
                          </span>
                        )}
                      </span>
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {opt.qualityTag}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>{opt.fps} FPS</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span>
                        {opt.approxSizeMb ? `~${opt.approxSizeMb} MB` : 'Auto Size'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="uppercase">{videoFormat}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() =>
                        onDownload({
                          type: 'video',
                          height: opt.height,
                          format: videoFormat,
                        })
                      }
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition-colors ${
                        opt.recommended
                          ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-transparent dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download {opt.height}p</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Audio & MP3 Tab */}
        {activeTab === 'audio' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Audio & MP3 Bitrate Options</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-efficiency audio conversion downloaded directly from NovaTube with full track metadata.
                </p>
              </div>

              {/* Format selection */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAudioFormat('mp3')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    audioFormat === 'mp3'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  MP3 (Universal)
                </button>
                <button
                  type="button"
                  onClick={() => setAudioFormat('m4a')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    audioFormat === 'm4a'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  M4A (Apple AAC)
                </button>
              </div>
            </div>

            {/* Audio Qualities List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {info.audioOptions.map((opt) => (
                <div
                  key={opt.bitrate}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    opt.recommended
                      ? 'border-rose-400/80 bg-rose-50/50 shadow-xs dark:border-rose-500/50 dark:bg-rose-950/15'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        {opt.bitrate} kbps
                      </span>
                      {opt.recommended && (
                        <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                          Best Quality
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                      {opt.label.split('(')[1]?.replace(')', '') || 'High Audio Quality'}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>{opt.approxSizeMb ? `~${opt.approxSizeMb} MB` : 'Est. size'}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="uppercase">{audioFormat}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() =>
                        onDownload({
                          type: 'audio',
                          audioBitrate: opt.bitrate,
                          format: audioFormat,
                        })
                      }
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition-colors ${
                        opt.recommended
                          ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-transparent dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download {opt.bitrate}k {audioFormat.toUpperCase()}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Trim & Clip Tab */}
        {activeTab === 'trim' && (
          <div className="max-w-3xl">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cut & Download Specific Clip</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download only the exact segment you need directly from NovaTube without saving the entire video.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-6 dark:border-slate-800 dark:bg-slate-950/60">
              {/* Type Switcher */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format:</span>
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setTrimType('video')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      trimType === 'video'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Video Clip (MP4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrimType('audio')}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      trimType === 'audio'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Audio Clip (MP3)
                  </button>
                </div>
              </div>

              {/* Start & End Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Start Time:</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {formatSecondsToTimestamp(startSec)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, endSec - 1)}
                    value={startSec}
                    onChange={(e) => setStartSec(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={endSec - 1}
                      value={startSec}
                      onChange={(e) => setStartSec(Math.min(endSec - 1, Math.max(0, Number(e.target.value))))}
                      className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">seconds</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">End Time:</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                      {formatSecondsToTimestamp(endSec)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={startSec + 1}
                    max={info.duration || 300}
                    value={endSec}
                    onChange={(e) => setEndSec(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={startSec + 1}
                      max={info.duration || 300}
                      value={endSec}
                      onChange={(e) => setEndSec(Math.max(startSec + 1, Number(e.target.value)))}
                      className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-mono text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">seconds</span>
                  </div>
                </div>
              </div>

              {/* Quality Selection for Trimming */}
              {trimType === 'video' ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Resolution:</span>
                  <select
                    value={trimQuality}
                    onChange={(e) => setTrimQuality(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:border-rose-500 focus:outline-none"
                  >
                    {info.videoOptions.map((v) => (
                      <option key={v.height} value={v.height}>
                        {v.label} ({v.height}p)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Audio Bitrate:</span>
                  <select
                    value={trimBitrate}
                    onChange={(e) => setTrimBitrate(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:border-rose-500 focus:outline-none"
                  >
                    <option value={320}>320 kbps (Studio Quality)</option>
                    <option value={256}>256 kbps (Very High)</option>
                    <option value={192}>192 kbps (Standard High)</option>
                    <option value={128}>128 kbps (Compact)</option>
                  </select>
                </div>
              )}

              {/* Summary and Trigger Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  Clip duration:{' '}
                  <span className="text-slate-900 dark:text-white font-bold">
                    {Math.max(0, endSec - startSec)} seconds
                  </span>{' '}
                  ({formatSecondsToTimestamp(startSec)} → {formatSecondsToTimestamp(endSec)})
                </div>

                <button
                  type="button"
                  onClick={handleStartTrimDownload}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-950/20 hover:bg-rose-500 transition-colors"
                >
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Download Trimmed Clip</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Thumbnail Tab */}
        {activeTab === 'thumbnail' && (
          <div className="max-w-2xl">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Full Resolution Cover Art</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download the official YouTube maximum resolution video poster (HD 1080p).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Full HD YouTube Poster (.jpg)
                </span>
                <a
                  href={info.thumbnail}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`${info.id}_thumbnail.jpg`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-transparent dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Save Image</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
