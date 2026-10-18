// Client-side real-time RTMP streaming pipeline to YouTube via backend FFmpeg relay

export interface StreamRelayEvent {
  type: 'status' | 'log' | 'error' | 'stats';
  state?: 'starting' | 'connected' | 'closed' | 'stopped';
  message?: string;
  bytesSent?: number;
  log?: string;
}

export class StreamNetRelay {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isRelaying = false;
  private bytesSent = 0;
  private onEventCallback: ((event: StreamRelayEvent) => void) | null = null;

  constructor(onEvent?: (event: StreamRelayEvent) => void) {
    if (onEvent) {
      this.onEventCallback = onEvent;
    }
  }

  public setEventCallback(callback: (event: StreamRelayEvent) => void) {
    this.onEventCallback = callback;
  }

  public isStreaming(): boolean {
    return this.isRelaying;
  }

  public getBytesSent(): number {
    return this.bytesSent;
  }

  // Start real broadcast to YouTube
  public async startStream(
    stream: MediaStream,
    rtmpUrl: string,
    streamKey: string
  ): Promise<boolean> {
    if (!streamKey || streamKey.trim() === '') {
      this.notify({
        type: 'error',
        message: 'Clé de flux YouTube manquante. Veuillez copier votre clé de flux sur YouTube Studio.',
      });
      return false;
    }

    try {
      this.bytesSent = 0;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/stream/ws`;

      console.log('[StreamNet Relay Client] Connecting to', wsUrl);
      this.ws = new WebSocket(wsUrl);

      await new Promise<void>((resolve, reject) => {
        if (!this.ws) return reject(new Error('WebSocket not created'));

        const timeout = setTimeout(() => {
          reject(new Error('Timeout de connexion au relais de streaming'));
        }, 8000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[StreamNet Relay Client] Connected to streaming server');
          resolve();
        };

        this.ws.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Impossible de contacter le relais de streaming local'));
        };
      });

      const secureRtmpUrl = (rtmpUrl && rtmpUrl.trim() !== '') ? rtmpUrl : 'rtmps://a.rtmp.youtube.com:443/live2';

      // Send Start handshake with RTMP credentials
      this.ws?.send(
        JSON.stringify({
          action: 'start',
          rtmpUrl: secureRtmpUrl,
          streamKey,
        })
      );

      // Listen for server messages
      this.ws!.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'relay_status') {
            this.notify({
              type: 'status',
              state: data.state,
              message: data.message,
            });
          } else if (data.type === 'error') {
            this.notify({
              type: 'error',
              message: data.message,
            });
          } else if (data.type === 'relay_log') {
            this.notify({
              type: 'log',
              log: data.log,
            });
          }
        } catch (e) {
          console.warn('[StreamNet Relay Client] Could not parse message:', event.data);
        }
      };

      this.ws!.onclose = () => {
        console.log('[StreamNet Relay Client] WebSocket closed');
        this.stopStream();
      };

      // Determine supported mimeType for browser MediaRecorder
      const supportedMimeTypes = [
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
      ];
      let selectedMime = supportedMimeTypes.find((m) =>
        MediaRecorder.isTypeSupported(m)
      );

      console.log('[StreamNet Relay Client] Using mimeType:', selectedMime || 'default');

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 4000000, // 4 Mbps
      });

      this.mediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const buffer = await e.data.arrayBuffer();
          this.ws.send(buffer);
          this.bytesSent += buffer.byteLength;
          this.notify({
            type: 'stats',
            bytesSent: this.bytesSent,
          });
        }
      };

      // Record in 500ms chunks for smooth real-time streaming
      this.mediaRecorder.start(500);
      this.isRelaying = true;

      this.notify({
        type: 'status',
        state: 'starting',
        message: 'Encodeur engagé. Transmission des paquets vers YouTube Studio...',
      });

      return true;
    } catch (err: any) {
      console.error('[StreamNet Relay Client] Error starting stream:', err);
      this.notify({
        type: 'error',
        message: err.message || 'Erreur lors du démarrage du flux de transmission',
      });
      this.stopStream();
      return false;
    }
  }

  // Stop stream
  public stopStream(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
      this.mediaRecorder = null;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ action: 'stop' }));
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.isRelaying = false;
    this.notify({
      type: 'status',
      state: 'stopped',
      message: 'Transmission RTMP arrêtée.',
    });
  }

  private notify(event: StreamRelayEvent) {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }
}

export const streamRelayInstance = new StreamNetRelay();
