export interface VideoOption {
  height: number;
  label: string;
  qualityTag: string;
  fps: number;
  approxSizeMb: number | null;
  hasAudio: boolean;
  recommended: boolean;
}

export interface AudioOption {
  bitrate: number;
  format: string;
  label: string;
  approxSizeMb: number | null;
  recommended: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  channel: string;
  channelUrl: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  viewCount: number;
  likeCount: number | null;
  uploadDate: string;
  description: string;
  botProtected?: boolean;
  videoOptions: VideoOption[];
  audioOptions: AudioOption[];
}

export interface DownloadJob {
  id: string;
  url?: string;
  targetVideoId?: string;
  status: 'initializing' | 'downloading' | 'processing' | 'ready' | 'error';
  progress: number;
  speed: string;
  eta: string;
  filename: string;
  fileSize?: number;
  error?: string;
  botProtected?: boolean;
}

export interface DownloadHistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  type: 'video' | 'audio';
  quality: string;
  filename: string;
  timestamp: number;
}
