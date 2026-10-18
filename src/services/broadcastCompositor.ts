// Real-time broadcast compositor: merges video frames, audio, and overlays into a MediaStream for YouTube RTMP streaming

export class BroadcastCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private audioCtx: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;
  private isCompositing = false;

  constructor(width = 1280, height = 720) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
  }

  // Initialize Web Audio and Canvas MediaStream
  public init(): MediaStream {
    if (this.stream) return this.stream;

    // Create 30 FPS video stream from canvas
    const videoStream = this.canvas.captureStream(30);

    // Create AudioContext with silent fallback audio track
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.audioDestination = this.audioCtx.createMediaStreamDestination();

      // Create a faint silent oscillator so the stream always has active audio frames (required by YouTube RTMP)
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.0001; // virtually silent, but active audio packets
      osc.connect(gain);
      gain.connect(this.audioDestination);
      osc.start();

      const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
      if (audioTrack) {
        videoStream.addTrack(audioTrack);
      }
    } catch (e) {
      console.warn('[BroadcastCompositor] AudioContext warning:', e);
    }

    this.stream = videoStream;
    return this.stream;
  }

  // Draw frame
  public renderFrame(
    videoEl: HTMLVideoElement | null,
    imageEl: HTMLImageElement | null,
    overlayConfig: {
      title?: string;
      subtitle?: string;
      tickerText?: string;
      showStandby?: boolean;
      watermarkText?: string;
    }
  ) {
    if (!this.ctx) return;
    const { width, height } = this.canvas;

    // Background
    this.ctx.fillStyle = '#070b14';
    this.ctx.fillRect(0, 0, width, height);

    // Draw active video or image
    if (videoEl && !videoEl.paused && !videoEl.ended && videoEl.readyState >= 2) {
      try {
        this.ctx.drawImage(videoEl, 0, 0, width, height);
      } catch (e) {}
    } else if (imageEl && imageEl.complete) {
      try {
        this.ctx.drawImage(imageEl, 0, 0, width, height);
      } catch (e) {}
    } else {
      // Standby geometric card
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(0, 0, width, height);

      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 36px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('STREAMNET STUDIO — EN DIRECT', width / 2, height / 2 - 20);

      this.ctx.fillStyle = '#94a3b8';
      this.ctx.font = '22px sans-serif';
      this.ctx.fillText('SIGNAL DE DIFFUSION YOUTUBE ACTIF', width / 2, height / 2 + 30);
    }

    // Overlays: Lower Third
    if (overlayConfig.title && !overlayConfig.showStandby) {
      this.ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      this.ctx.fillRect(40, height - 130, 520, 80);

      this.ctx.fillStyle = '#06b6d4';
      this.ctx.fillRect(40, height - 130, 8, 80);

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 24px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(overlayConfig.title.toUpperCase(), 65, height - 90);

      if (overlayConfig.subtitle) {
        this.ctx.fillStyle = '#67e8f9';
        this.ctx.font = '16px sans-serif';
        this.ctx.fillText(overlayConfig.subtitle, 65, height - 65);
      }
    }

    // Overlays: Watermark
    if (overlayConfig.watermarkText) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      this.ctx.fillRect(width - 200, 25, 175, 36);

      this.ctx.fillStyle = '#ef4444';
      this.ctx.beginPath();
      this.ctx.arc(width - 180, 43, 6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 15px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(overlayConfig.watermarkText, width - 165, 48);
    }

    // Overlays: Marquee Ticker
    if (overlayConfig.tickerText && !overlayConfig.showStandby) {
      this.ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
      this.ctx.fillRect(0, height - 36, width, 36);

      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(0, height - 36, 120, 36);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 13px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('EN DIRECT', 60, height - 13);

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.font = '14px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(overlayConfig.tickerText, 140, height - 13);
    }
  }

  private fallbackInterval: any = null;
  private connectedElements = new WeakSet<HTMLMediaElement>();

  public async resumeAudio() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('Could not resume AudioContext', e);
      }
    }
  }

  public connectMediaElement(element: HTMLMediaElement | null) {
    if (!element || !this.audioCtx || !this.audioDestination) return;
    try {
      if (!this.connectedElements.has(element)) {
        const source = this.audioCtx.createMediaElementSource(element);
        source.connect(this.audioDestination);
        source.connect(this.audioCtx.destination);
        this.connectedElements.add(element);
      }
    } catch (e) {
      // Element may already be connected or have CORS constraints
    }
  }

  public startLoop(
    getVideoEl: () => HTMLVideoElement | null,
    getImageEl: () => HTMLImageElement | null,
    getOverlayConfig: () => any
  ) {
    if (this.isCompositing) return;
    this.isCompositing = true;

    this.resumeAudio();

    // Initial immediate frame render
    this.renderFrame(getVideoEl(), getImageEl(), getOverlayConfig());

    let lastTick = performance.now();

    const tick = () => {
      const now = performance.now();
      // Enforce 30 FPS throttle
      if (now - lastTick >= 28) {
        const vEl = getVideoEl();
        if (vEl) this.connectMediaElement(vEl);
        this.renderFrame(vEl, getImageEl(), getOverlayConfig());
        lastTick = now;
      }
    };

    // Primary requestAnimationFrame loop for ultra smooth rendering when tab is visible
    const loop = () => {
      if (!this.isCompositing) return;
      tick();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();

    // Fallback interval (every 33ms) ensures rendering never stops even if user switches to YouTube Studio tab
    if (this.fallbackInterval) clearInterval(this.fallbackInterval);
    this.fallbackInterval = setInterval(() => {
      if (!this.isCompositing) return;
      tick();
    }, 33);
  }

  public stopLoop() {
    this.isCompositing = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  public getStream(): MediaStream {
    return this.init();
  }
}

export const broadcastCompositor = new BroadcastCompositor(1280, 720);
