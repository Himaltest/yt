import express, { Request, Response } from 'express';
import cors from 'cors';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const YTDLP_PATH = path.resolve(process.cwd(), 'bin/yt-dlp');
const CACHE_DIR = path.resolve('/tmp/novatube_cache');
const DENO_PATH = '/usr/local/bin/deno';

// Optional server-wide YouTube cookie from environment
const SERVER_YOUTUBE_COOKIE = process.env.YOUTUBE_COOKIE || '';

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Ensure yt-dlp standalone binary is available and functional
async function ensureYtDlp(): Promise<void> {
  if (fs.existsSync(YTDLP_PATH)) {
    try {
      fs.chmodSync(YTDLP_PATH, 0o755);
      const testVer = execSync(`${YTDLP_PATH} --version`, { stdio: 'pipe' }).toString().trim();
      if (testVer) {
        return;
      }
    } catch {
      console.warn('[NovaTube] Existing yt-dlp binary is non-functional. Downloading fresh standalone build...');
      try {
        fs.unlinkSync(YTDLP_PATH);
      } catch {
        // Ignore
      }
    }
  }

  console.log('[NovaTube] Downloading standalone yt-dlp_linux binary...');
  fs.mkdirSync(path.dirname(YTDLP_PATH), { recursive: true });

  const downloadBinary = (targetUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      https
        .get(targetUrl, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            downloadBinary(res.headers.location).then(resolve).catch(reject);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download binary: HTTP ${res.statusCode}`));
            return;
          }
          const fileStream = fs.createWriteStream(YTDLP_PATH);
          res.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            fs.chmodSync(YTDLP_PATH, 0o755);
            console.log('[NovaTube] yt-dlp binary ready.');
            resolve();
          });
        })
        .on('error', reject);
    });
  };

  await downloadBinary('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux');
}

// Bootstrap check
ensureYtDlp().catch((err) => console.error('[NovaTube] Error ensuring yt-dlp:', err));

// Ephemeral cache cleanup: prune files older than 30 minutes
setInterval(() => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    for (const f of files) {
      const full = path.join(CACHE_DIR, f);
      const stat = fs.statSync(full);
      if (now - stat.mtimeMs > 30 * 60 * 1000) {
        fs.rmSync(full, { recursive: true, force: true });
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}, 15 * 60 * 1000);

export interface Job {
  id: string;
  url: string;
  targetVideoId?: string;
  status: 'initializing' | 'downloading' | 'processing' | 'ready' | 'error';
  progress: number;
  speed: string;
  eta: string;
  filename: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
  botProtected?: boolean;
  createdAt: number;
}

const jobs = new Map<string, Job>();

// Utility: Sanitize filename
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'download';
}

// Utility: Normalize YouTube URL
function extractVideoId(inputUrl: string): string | null {
  const trimmed = inputUrl.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Detect bot protection challenges in yt-dlp output
function isBotProtectionError(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('sign in to confirm') ||
    lower.includes('not a bot') ||
    lower.includes('bot detection') ||
    lower.includes('http error 429') ||
    lower.includes('confirm you’re not a bot') ||
    lower.includes('confirm you\'re not a bot') ||
    lower.includes('requires authentication')
  );
}

// Convert user cookies to Netscape format without logging or persisting
function formatToNetscapeCookies(rawCookies: string): string {
  const trimmed = rawCookies.trim();
  if (trimmed.includes('# Netscape HTTP Cookie File') || trimmed.includes('\t.youtube.com\t') || trimmed.includes('.youtube.com\t')) {
    return trimmed;
  }

  const lines = ['# Netscape HTTP Cookie File', '# http://curl.haxx.se/rfc/cookie_spec.html', ''];
  const pairs = trimmed.split(';');
  const futureExpiry = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;

  for (const pair of pairs) {
    if (pair.includes('=')) {
      const [key, ...vals] = pair.trim().split('=');
      const val = vals.join('=');
      if (key && val) {
        lines.push(`.youtube.com\tTRUE\t/\tTRUE\t${futureExpiry}\t${key.trim()}\t${val.trim()}`);
      }
    }
  }
  return lines.join('\n');
}

// Fetch YouTube oEmbed metadata as fallback
function fetchOEmbed(targetUrl: string): Promise<any> {
  return new Promise((resolve) => {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
    https
      .get(oembedUrl, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => resolve(null));
  });
}

// Build standard yt-dlp arguments
function buildYtDlpBaseArgs(): string[] {
  const args = [
    '--no-playlist',
    '--extractor-args',
    'youtube:player_client=android,ios,mweb,web',
    '--no-warnings',
    '--no-check-certificates',
  ];

  if (fs.existsSync(DENO_PATH)) {
    args.push('--js-runtimes', `deno:${DENO_PATH}`);
  }

  return args;
}

// GET /api/health
app.get('/api/health', async (_req: Request, res: Response) => {
  await ensureYtDlp().catch(() => {});
  const binaryExists = fs.existsSync(YTDLP_PATH);
  res.json({
    status: 'ok',
    ytdlp: binaryExists ? 'installed' : 'missing',
    cacheDir: CACHE_DIR,
    activeJobs: jobs.size,
  });
});

// POST /api/info - Fetch video metadata and formats
app.post('/api/info', async (req: Request, res: Response): Promise<void> => {
  const { url, cookies } = req.body;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Please provide a valid YouTube video URL.' });
    return;
  }

  await ensureYtDlp().catch(() => {});

  const videoId = extractVideoId(url);
  const targetUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url.trim();

  // Active cookies: prefer client-supplied session, fallback to server environment cookie
  const effectiveCookies = (cookies && typeof cookies === 'string' && cookies.trim()) || SERVER_YOUTUBE_COOKIE;

  let cookieFilePath: string | null = null;
  if (effectiveCookies) {
    const cookieContent = formatToNetscapeCookies(effectiveCookies);
    const cookieId = Math.random().toString(36).substring(2, 10);
    cookieFilePath = path.join(CACHE_DIR, `tmp_ck_${cookieId}.txt`);
    fs.writeFileSync(cookieFilePath, cookieContent, 'utf-8');
  }

  const args = ['--dump-json', ...buildYtDlpBaseArgs()];

  if (cookieFilePath) {
    args.push('--cookies', cookieFilePath);
  }

  args.push(targetUrl);

  const processChild = spawn(YTDLP_PATH, args);
  let stdoutData = '';
  let stderrData = '';

  processChild.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  processChild.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  processChild.on('close', async (code) => {
    // Delete ephemeral cookie file immediately
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
      try {
        fs.unlinkSync(cookieFilePath);
      } catch {
        // Ignore
      }
    }

    if (code !== 0 || !stdoutData.trim()) {
      if (isBotProtectionError(stderrData)) {
        // Automatically recover with oEmbed metadata
        const oembed = await fetchOEmbed(targetUrl);

        if (oembed && oembed.title) {
          res.json({
            id: videoId || 'video',
            title: oembed.title,
            channel: oembed.author_name || 'YouTube Creator',
            channelUrl: oembed.author_url || '',
            thumbnail: oembed.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),
            duration: 0,
            durationString: 'Full Video',
            viewCount: 0,
            likeCount: null,
            uploadDate: '',
            description: 'YouTube requires viewer authentication for cloud servers on this specific video.',
            botProtected: true,
            videoOptions: [
              { height: 1080, label: '1080p Full HD', qualityTag: 'FHD', fps: 30, approxSizeMb: null, hasAudio: true, recommended: true },
              { height: 720, label: '720p HD', qualityTag: 'HD', fps: 30, approxSizeMb: null, hasAudio: true, recommended: false },
              { height: 480, label: '480p Standard', qualityTag: 'SD', fps: 30, approxSizeMb: null, hasAudio: true, recommended: false },
              { height: 360, label: '360p Compact', qualityTag: 'SD', fps: 30, approxSizeMb: null, hasAudio: true, recommended: false },
            ],
            audioOptions: [
              { bitrate: 320, format: 'mp3', label: '320 kbps (Studio Master)', approxSizeMb: null, recommended: true },
              { bitrate: 256, format: 'mp3', label: '256 kbps (Very High)', approxSizeMb: null, recommended: false },
              { bitrate: 192, format: 'mp3', label: '192 kbps (Standard High)', approxSizeMb: null, recommended: false },
              { bitrate: 128, format: 'mp3', label: '128 kbps (Compact)', approxSizeMb: null, recommended: false },
            ],
          });
          return;
        }

        res.status(403).json({
          error: 'YouTube requires authentication for this video. Please click Bot Bypass in the header to paste your YouTube session cookies.',
          botProtected: true,
          videoId,
        });
        return;
      }

      let userFriendlyError = 'Could not fetch video info. Please make sure the video is public and accessible.';
      if (stderrData.includes('Private video')) {
        userFriendlyError = 'This video is private and cannot be downloaded.';
      } else if (stderrData.includes('Video unavailable')) {
        userFriendlyError = 'This video is unavailable or has been removed.';
      }
      res.status(500).json({ error: userFriendlyError });
      return;
    }

    try {
      const data = JSON.parse(stdoutData.trim());
      const formats = data.formats || [];

      const resolutions = [2160, 1440, 1080, 720, 480, 360, 240, 144];
      const videoOptions: Array<{
        height: number;
        label: string;
        qualityTag: string;
        fps: number;
        approxSizeMb: number | null;
        hasAudio: boolean;
        recommended: boolean;
      }> = [];

      for (const resHeight of resolutions) {
        const matching = formats.filter(
          (f: any) => f.vcodec !== 'none' && f.height === resHeight
        );

        if (matching.length > 0) {
          matching.sort((a: any, b: any) => (b.tbr || 0) - (a.tbr || 0));
          const best = matching[0];

          let sizeMb: number | null = null;
          if (best.filesize) {
            sizeMb = Math.round((best.filesize / (1024 * 1024)) * 10) / 10;
          } else if (best.filesize_approx) {
            sizeMb = Math.round((best.filesize_approx / (1024 * 1024)) * 10) / 10;
          } else if (best.tbr && data.duration) {
            sizeMb = Math.round(((best.tbr * 1000 * data.duration) / 8 / (1024 * 1024)) * 10) / 10;
          }

          if (sizeMb && data.duration) {
            sizeMb = Math.round((sizeMb + (128 * 1000 * data.duration) / 8 / (1024 * 1024)) * 10) / 10;
          }

          let label = `${resHeight}p`;
          let qualityTag = 'HD';
          if (resHeight >= 2160) {
            label = '4K Ultra HD';
            qualityTag = '4K';
          } else if (resHeight >= 1440) {
            label = '2K Quad HD';
            qualityTag = '2K';
          } else if (resHeight === 1080) {
            label = '1080p Full HD';
            qualityTag = 'FHD';
          } else if (resHeight === 720) {
            label = '720p HD';
            qualityTag = 'HD';
          } else {
            label = `${resHeight}p Standard`;
            qualityTag = 'SD';
          }

          videoOptions.push({
            height: resHeight,
            label,
            qualityTag,
            fps: best.fps || 30,
            approxSizeMb: sizeMb,
            hasAudio: true,
            recommended: resHeight === 1080 || (resHeight === 720 && !videoOptions.some((v) => v.height === 1080)),
          });
        }
      }

      if (videoOptions.length === 0) {
        const muxed = formats.filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none');
        for (const m of muxed) {
          const h = m.height || 360;
          if (!videoOptions.some((v) => v.height === h)) {
            videoOptions.push({
              height: h,
              label: `${h}p`,
              qualityTag: h >= 720 ? 'HD' : 'SD',
              fps: m.fps || 30,
              approxSizeMb: m.filesize ? Math.round((m.filesize / 1024 / 1024) * 10) / 10 : null,
              hasAudio: true,
              recommended: h === 720,
            });
          }
        }
      }

      const audioBitrates = [
        { kbps: 320, label: '320 kbps (Studio Quality / Master)', isRecommended: true },
        { kbps: 256, label: '256 kbps (Very High Quality)', isRecommended: false },
        { kbps: 192, label: '192 kbps (Standard High Quality)', isRecommended: false },
        { kbps: 128, label: '128 kbps (Standard / Compact)', isRecommended: false },
      ];

      const audioOptions = audioBitrates.map((ab) => {
        const estMb = data.duration
          ? Math.round(((ab.kbps * 1000 * data.duration) / 8 / (1024 * 1024)) * 10) / 10
          : null;
        return {
          bitrate: ab.kbps,
          format: 'mp3',
          label: ab.label,
          approxSizeMb: estMb,
          recommended: ab.isRecommended,
        };
      });

      let bestThumb = data.thumbnail;
      if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
        const sortedThumbs = [...data.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
        bestThumb = sortedThumbs[0].url || bestThumb;
      }

      res.json({
        id: data.id,
        title: data.title,
        channel: data.uploader || data.channel || 'Unknown Artist',
        channelUrl: data.uploader_url || data.channel_url || '',
        thumbnail: bestThumb,
        duration: data.duration || 0,
        durationString: data.duration_string || '0:00',
        viewCount: data.view_count || 0,
        likeCount: data.like_count || null,
        uploadDate: data.upload_date || '',
        description: data.description ? data.description.slice(0, 300) : '',
        botProtected: false,
        videoOptions,
        audioOptions,
      });
    } catch (parseErr) {
      console.error('[NovaTube] Parse JSON error:', parseErr);
      res.status(500).json({ error: 'Failed to parse video format data.' });
    }
  });
});

// POST /api/download/start - Start download job on NovaTube
app.post('/api/download/start', async (req: Request, res: Response): Promise<void> => {
  const {
    url,
    type,
    height,
    audioBitrate,
    format = 'mp4',
    startTime,
    endTime,
    title = 'download',
    cookies,
  } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  await ensureYtDlp().catch(() => {});

  const videoId = extractVideoId(url);
  const targetUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url.trim();

  const jobId = Math.random().toString(36).substring(2, 12);
  const jobDir = path.join(CACHE_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const effectiveCookies = (cookies && typeof cookies === 'string' && cookies.trim()) || SERVER_YOUTUBE_COOKIE;

  let cookieFilePath: string | null = null;
  if (effectiveCookies) {
    const formatted = formatToNetscapeCookies(effectiveCookies);
    cookieFilePath = path.join(jobDir, 'session_cookies.txt');
    fs.writeFileSync(cookieFilePath, formatted, 'utf-8');
  }

  const cleanBaseTitle = sanitizeFilename(title);
  let finalExtension = format.toLowerCase();
  if (type === 'audio' && !['mp3', 'm4a', 'opus', 'wav'].includes(finalExtension)) {
    finalExtension = 'mp3';
  } else if (type === 'video' && !['mp4', 'webm', 'mkv'].includes(finalExtension)) {
    finalExtension = 'mp4';
  }

  const targetFilename = `${cleanBaseTitle}_${type === 'video' ? (height ? `${height}p` : 'video') : `${audioBitrate || 320}kbps`}.${finalExtension}`;

  const job: Job = {
    id: jobId,
    url: targetUrl,
    targetVideoId: videoId || undefined,
    status: 'initializing',
    progress: 5,
    speed: 'Connecting...',
    eta: '--:--',
    filename: targetFilename,
    mimeType: type === 'audio' ? 'audio/mpeg' : 'video/mp4',
    createdAt: Date.now(),
  };

  jobs.set(jobId, job);

  const args: string[] = ['--newline', ...buildYtDlpBaseArgs()];

  if (cookieFilePath) {
    args.push('--cookies', cookieFilePath);
  }

  if (startTime && endTime) {
    args.push('--download-sections', `*${startTime}-${endTime}`);
    args.push('--force-keyframes-at-cuts');
  }

  const outputTemplate = path.join(jobDir, 'output.%(ext)s');

  if (type === 'audio') {
    if (finalExtension === 'mp3') {
      args.push(
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        `${audioBitrate || 320}K`,
        '-o',
        outputTemplate
      );
    } else if (finalExtension === 'm4a') {
      args.push(
        '-f',
        'ba[ext=m4a]/ba',
        '-x',
        '--audio-format',
        'm4a',
        '-o',
        outputTemplate
      );
    } else {
      args.push(
        '-x',
        '--audio-format',
        finalExtension,
        '-o',
        outputTemplate
      );
    }
  } else {
    const maxHeight = height || 1080;
    args.push(
      '-f',
      `bv*[height<=${maxHeight}]+ba/b[height<=${maxHeight}]/b`,
      '--merge-output-format',
      finalExtension,
      '-o',
      outputTemplate
    );
  }

  args.push(targetUrl);

  const child = spawn(YTDLP_PATH, args, { cwd: jobDir });
  job.status = 'downloading';

  let fullStderr = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/);
    if (match) {
      const pct = parseFloat(match[1]);
      job.progress = Math.min(92, Math.max(job.progress, Math.round(pct * 0.9)));
      job.speed = match[3];
      job.eta = match[4];
    } else if (text.includes('[ExtractAudio]') || text.includes('[Merger]') || text.includes('[ffmpeg]')) {
      job.status = 'processing';
      job.progress = 95;
      job.speed = 'Encoding with FFmpeg...';
      job.eta = 'Almost ready';
    }
  });

  child.stderr.on('data', (data) => {
    fullStderr += data.toString();
  });

  child.on('close', (code) => {
    // Delete ephemeral cookie file immediately
    if (cookieFilePath && fs.existsSync(cookieFilePath)) {
      try {
        fs.unlinkSync(cookieFilePath);
      } catch {
        // Ignore unlink error
      }
    }

    if (code !== 0) {
      job.status = 'error';
      if (isBotProtectionError(fullStderr)) {
        job.botProtected = true;
        job.error = 'YouTube requires session authentication for this video on cloud servers. Click below to add your YouTube cookie and download in full quality.';
      } else if (fullStderr.includes('Private video')) {
        job.error = 'This video is private and cannot be downloaded.';
      } else {
        job.error = 'Download failed for this format. Please retry or choose another resolution.';
      }
      return;
    }

    try {
      const files = fs.readdirSync(jobDir);
      const outputFound = files.find((f) => !f.endsWith('.part') && !f.endsWith('.ytdl') && !f.endsWith('.txt'));
      if (outputFound) {
        const fullFilePath = path.join(jobDir, outputFound);
        const stats = fs.statSync(fullFilePath);
        job.filePath = fullFilePath;
        job.fileSize = stats.size;
        job.status = 'ready';
        job.progress = 100;
        job.speed = 'Completed';
        job.eta = '00:00';
      } else {
        job.status = 'error';
        job.error = 'Output media file could not be created.';
      }
    } catch (e: any) {
      job.status = 'error';
      job.error = e.message;
    }
  });

  res.json({ jobId, filename: targetFilename });
});

// GET /api/download/status/:id - Poll job status
app.get('/api/download/status/:id', (req: Request, res: Response): void => {
  const job = jobs.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json({
    id: job.id,
    url: job.url,
    targetVideoId: job.targetVideoId,
    status: job.status,
    progress: job.progress,
    speed: job.speed,
    eta: job.eta,
    filename: job.filename,
    fileSize: job.fileSize,
    error: job.error,
    botProtected: job.botProtected,
  });
});

// GET /api/download/file/:id - Deliver the completed file download directly from NovaTube
app.get('/api/download/file/:id', (req: Request, res: Response): void => {
  const job = jobs.get(req.params.id);
  if (!job || job.status !== 'ready' || !job.filePath || !fs.existsSync(job.filePath)) {
    res.status(404).json({ error: 'File is not ready or has expired.' });
    return;
  }

  res.download(job.filePath, job.filename, (err) => {
    if (err) {
      console.error('[NovaTube] Download stream error:', err);
    }
  });
});

async function startServer() {
  await ensureYtDlp().catch((e) => console.error('[NovaTube] Bootstrap yt-dlp check:', e));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NovaTube] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[NovaTube] Failed to start server:', err);
});
