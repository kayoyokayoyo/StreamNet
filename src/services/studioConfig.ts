import { MediaItem, YouTubeChannel, StreamSettings, OverlayConfig, ChatMessage } from '../types/stream';

// Application logo asset for studio branding
export const LOGO_ASSET = '/src/assets/images/streamnet_studio_logo_1792315161540.jpg';
export const TESTCARD_ASSET = '/src/assets/images/studio_broadcast_testcard_1792315161879.jpg';

// STORAGE KEYS
export const STORAGE_CHANNEL_KEY = 'streamnet_yt_channel_v2';
export const STORAGE_SETTINGS_KEY = 'streamnet_stream_settings_v2';
export const STORAGE_OVERLAYS_KEY = 'streamnet_overlays_v2';

// CLEAN INITIAL CHANNEL (NO DEMO DATA)
export const DEFAULT_CHANNEL: YouTubeChannel = {
  id: '',
  name: '',
  handle: '',
  email: '',
  avatarUrl: '',
  subscribersFormatted: '',
  isConnected: false,
  liveStreamingEnabled: false,
  authType: 'oauth',
};

// CLEAN STREAM SETTINGS (NO FAKE STREAM KEYS)
export const DEFAULT_STREAM_SETTINGS: StreamSettings = {
  streamUrl: 'rtmps://a.rtmp.youtube.com:443/live2',
  streamKey: '',
  broadcastTitle: 'Direct Studio StreamNet',
  broadcastDescription: 'Diffusion en direct réalisée avec StreamNet Studio.',
  privacy: 'public',
  latencyMode: 'low',
  category: 'Divertissement',
  qualityPreset: '1080p60',
  targetBitrate: 6500,
  autoStartOnQueue: true,
  continuous247Loop: true,
  emergencyFallbackActive: true,
};

export const DEFAULT_OVERLAYS: OverlayConfig = {
  showWatermark: true,
  showLowerThird: true,
  lowerThirdTitle: 'STUDIO EN DIRECT',
  lowerThirdSubtitle: 'StreamNet Broadcast Engine',
  showBannerTicker: false,
  bannerTickerText: '',
  showStandbySlate: false,
  showLiveBadge: true,
  showClock: true,
};

// ZERO DEMO MEDIA
export const DEFAULT_MEDIA_LIST: MediaItem[] = [];

// ZERO DEMO CHAT MESSAGES
export const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [];

// LocalStorage Helpers
export function loadSavedChannel(): YouTubeChannel {
  try {
    const raw = localStorage.getItem(STORAGE_CHANNEL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read saved channel', e);
  }
  return DEFAULT_CHANNEL;
}

export function saveChannel(channel: YouTubeChannel): void {
  try {
    localStorage.setItem(STORAGE_CHANNEL_KEY, JSON.stringify(channel));
  } catch (e) {
    console.warn('Could not save channel', e);
  }
}

export function loadSavedSettings(): StreamSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_STREAM_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Could not read saved settings', e);
  }
  return DEFAULT_STREAM_SETTINGS;
}

export function saveSettings(settings: StreamSettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not save settings', e);
  }
}

export function loadSavedOverlays(): OverlayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_OVERLAYS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_OVERLAYS, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Could not read saved overlays', e);
  }
  return DEFAULT_OVERLAYS;
}

export function saveOverlays(overlays: OverlayConfig): void {
  try {
    localStorage.setItem(STORAGE_OVERLAYS_KEY, JSON.stringify(overlays));
  } catch (e) {
    console.warn('Could not save overlays', e);
  }
}
