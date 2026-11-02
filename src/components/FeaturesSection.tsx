import React, { useState } from 'react';
import {
  Film,
  Music2,
  Sliders,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does NovaTube achieve 4K and 1080p Full HD video downloads?',
      a: 'YouTube separates high-definition video (1080p, 1440p, 4K) into separate adaptive video and audio streams. NovaTube’s dedicated backend engine uses high-performance FFmpeg stream muxing to seamlessly combine the highest-bitrate video stream with crystal-clear audio into a universal MP4 container without re-compression loss.',
    },
    {
      q: 'Which MP3 audio quality should I choose?',
      a: 'For listening on headphones or speakers, 320 kbps (Studio Master) provides uncompromised high-fidelity sound. If you are conserving disk space or transferring to older MP3 devices, 192 kbps or 128 kbps provides a great balance of clarity and compact file size.',
    },
    {
      q: 'Can I download only a specific part of a video or podcast?',
      a: 'Yes! Use the "Trim & Cut Clip" tab in the downloader. You can specify exact start and end timestamps (e.g. 00:00:15 to 00:01:30) to download only the portion of the video or audio you want, saving time and storage.',
    },
    {
      q: 'Are downloaded MP4 and MP3 files compatible with iPhone, Android, and Mac/PC?',
      a: 'Yes. The default MP4 format uses universal H.264 video with AAC audio codecs, and the MP3 format uses ISO-standard LAME audio tags. Both play natively in Apple Files, QuickTime, VLC, Windows Media Player, Android Gallery, and all modern smartphones.',
    },
    {
      q: 'Is there a limit on video duration or file size?',
      a: 'You can download YouTube Shorts, music videos, educational lectures, and full-length multi-hour documentaries. Temporary conversion cache is automatically cleared from the server to maintain maximum speed.',
    },
  ];

  return (
    <section className="mt-16 space-y-16">
      {/* Feature Highlights Grid */}
      <div id="formats">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Engineered for Precision & Sound Quality
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Every download is processed directly on our high-speed server pipeline with native FFmpeg encoding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
              <Film className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Full Resolution 4K & 1080p</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Never settle for blurry 360p rips. Download full 2160p (4K UHD), 1440p (2K), and 1080p Full HD at original 60 FPS frame rates.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/20">
              <Music2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Studio 320 kbps MP3 Conversion</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Extract high-bitrate MP3, M4A, or Opus audio tracks. Choose between 320k, 256k, 192k, and 128k bitrates for podcasts, audiobooks, and music.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Instant Video & Audio Trimming</h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Clip specific segments directly before downloading. Isolate soundbites, funny moments, or study highlights without heavy editing software.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="max-w-3xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-rose-500" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Everything you need to know about formats, qualities, and device compatibility.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left font-medium text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white transition-colors"
                >
                  <span className="text-sm font-semibold pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-rose-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
