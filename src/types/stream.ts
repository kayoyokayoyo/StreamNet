export type MediaType = 'video' | 'audio' | 'image';

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  duration: number; // in seconds
  sizeFormatted: string;
  thumbnailUrl?: string;
  isLooping?: boolean;
  gain: number; // 0 to 1
  isUploaded?: boolean;
}

export type StreamStatus = 'offline' | 'connecting' | 'live' | 'ending';

export interface StreamHealth {
  status: 'excellent' | 'good' | 'warning' | 'error';
  bitrateKbps: number;
  fps: number;
  droppedFrames: number;
  totalFrames: number;
  cpuLoad: number;
  bufferHealth: number; // 0 to 100%
  resolution: string;
}

export interface StreamSettings {
  streamUrl: string;
  streamKey: string;
  broadcastTitle: string;
  broadcastDescription: string;
  privacy: 'public' | 'unlisted' | 'private';
  latencyMode: 'ultra_low' | 'low' | 'normal';
  category: string;
  qualityPreset: '1080p60' | '1080p30' | '720p60' | '4k';
  targetBitrate: number; // kbps
  autoStartOnQueue: boolean;
  continuous247Loop: boolean;
  emergencyFallbackActive: boolean;
  scheduledTime?: string;
}

export interface YouTubeChannel {
  id: string;
  name: string;
  handle: string;
  email?: string;
  avatarUrl: string;
  subscribersFormatted?: string;
  isConnected: boolean;
  liveStreamingEnabled: boolean;
  authType: 'oauth' | 'manual';
  authTimestamp?: string;
  streamSessionToken?: string;
}

export interface OverlayConfig {
  showWatermark: boolean;
  showLowerThird: boolean;
  lowerThirdTitle: string;
  lowerThirdSubtitle: string;
  showBannerTicker: boolean;
  bannerTickerText: string;
  showStandbySlate: boolean;
  showLiveBadge: boolean;
  showClock: boolean;
}

export interface ChatMessage {
  id: string;
  author: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
  isModerator?: boolean;
  isChannelOwner?: boolean;
  isPinned?: boolean;
}

export interface AudioChannelState {
  id: string;
  name: string;
  volume: number; // 0 to 1
  isMuted: boolean;
  levelLeft: number; // 0 to 1
  levelRight: number; // 0 to 1
}
