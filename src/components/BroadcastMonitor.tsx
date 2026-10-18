import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Radio, AlertTriangle } from 'lucide-react';
import { MediaItem, OverlayConfig, StreamStatus } from '../types/stream';
import { TESTCARD_ASSET, LOGO_ASSET } from '../services/mockData';

interface BroadcastMonitorProps {
  currentMedia: MediaItem | null;
  status: StreamStatus;
  uptimeSeconds: number;
  overlays: OverlayConfig;
  masterVolume: number;
  setMasterVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  onMediaEnded: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  onOpenMediaTab?: () => void;
}

export const BroadcastMonitor: React.FC<BroadcastMonitorProps> = ({
  currentMedia,
  status,
  uptimeSeconds,
  overlays,
  masterVolume,
  setMasterVolume,
  isMuted,
  setIsMuted,
  onMediaEnded,
  onTimeUpdate,
  videoRef,
  audioRef,
  isPlaying,
  onOpenMediaTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vuLeft, setVuLeft] = useState(0.72);
  const [vuRight, setVuRight] = useState(0.68);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('00:00:00');

  // Local clock for studio overlay
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeFormatted(now.toLocaleTimeString('fr-FR', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio VU Meter simulation linked to playback state
  useEffect(() => {
    if (!isPlaying) {
      setVuLeft(0.02);
      setVuRight(0.02);
      return;
    }
    const interval = setInterval(() => {
      if (isMuted) {
        setVuLeft(0.01);
        setVuRight(0.01);
      } else {
        const base = masterVolume * 0.75;
        const jitterL = Math.random() * 0.25;
        const jitterR = Math.random() * 0.25;
        setVuLeft(Math.min(0.98, Math.max(0.1, base + jitterL)));
        setVuRight(Math.min(0.98, Math.max(0.1, base + jitterR)));
      }
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying, isMuted, masterVolume]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isVideo = currentMedia?.type === 'video';
  const isAudio = currentMedia?.type === 'audio';
  const isImage = currentMedia?.type === 'image';

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden border shadow-2xl flex flex-col group select-none transition-all ${
        status === 'live'
          ? 'border-rose-600/90 shadow-2xl shadow-rose-950/50 ring-1 ring-rose-500/50'
          : 'border-slate-800'
      }`}
      style={{ aspectRatio: '16 / 9' }}
    >
      {/* Visual Content Layer */}
      <div className="relative w-full h-full flex items-center justify-center bg-[#070a12] overflow-hidden">
        {/* Standby Slate (Overrides normal video when active) */}
        {overlays.showStandbySlate ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-cover bg-center">
            <img
              src={TESTCARD_ASSET}
              alt="Mire de secours studio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center">
              <div className="px-5 py-2 rounded-lg bg-black/80 border border-cyan-500/50 shadow-xl mb-4 flex items-center gap-3">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-bold tracking-widest text-sm uppercase">
                  MIRE DE STANDBY — STUDIO EN PAUSE
                </span>
              </div>
              <p className="text-slate-200 text-sm max-w-md">
                Reprise de la diffusion dans un instant. Le signal audio et vidéo reste maintenu sur votre chaîne YouTube.
              </p>
            </div>
          </div>
        ) : null}

        {/* Video Player */}
        {isVideo && currentMedia && (
          <video
            ref={videoRef}
            src={currentMedia.url}
            loop={currentMedia.isLooping}
            muted={isMuted}
            playsInline
            onEnded={onMediaEnded}
            onTimeUpdate={(e) => {
              const target = e.currentTarget;
              onTimeUpdate(target.currentTime, target.duration || currentMedia.duration);
            }}
            className="w-full h-full object-contain bg-black"
          />
        )}

        {/* Audio Player Screen with Waveform Visualization */}
        {isAudio && currentMedia && (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-950 via-[#0e1626] to-black">
            <audio
              ref={audioRef}
              src={currentMedia.url}
              loop={currentMedia.isLooping}
              muted={isMuted}
              onEnded={onMediaEnded}
              onTimeUpdate={(e) => {
                const target = e.currentTarget;
                onTimeUpdate(target.currentTime, target.duration || currentMedia.duration);
              }}
            />
            {/* Audio Album art / disk animation */}
            <div className="relative w-36 h-36 rounded-full border-4 border-cyan-500/30 flex items-center justify-center shadow-2xl shadow-cyan-950/80 mb-6 animate-pulse">
              <div className="w-28 h-28 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                <img
                  src={LOGO_ASSET}
                  alt="StreamNet Audio"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="text-center max-w-lg mb-6">
              <h3 className="text-xl font-bold text-white tracking-wide truncate">
                {currentMedia.name}
              </h3>
              <p className="text-xs text-cyan-400 font-mono mt-1">
                PISTE AUDIO STUDIO STEREO • 320 KBPS
              </p>
            </div>
            {/* Dynamic visualizer bars */}
            <div className="flex items-end gap-1.5 h-16 w-80 max-w-full px-4">
              {[45, 78, 92, 60, 85, 40, 95, 70, 88, 55, 90, 75, 62, 80, 50, 84, 68, 94, 72, 58].map(
                (barHeight, idx) => {
                  const factor = isPlaying && !isMuted ? (Math.sin(Date.now() / 200 + idx) + 1.2) / 2.2 : 0.08;
                  const currentH = Math.max(6, Math.round(barHeight * factor));
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-sm transition-all duration-100"
                      style={{
                        height: `${currentH}%`,
                        backgroundColor:
                          currentH > 75 ? '#f43f5e' : currentH > 50 ? '#38bdf8' : '#0284c7',
                      }}
                    />
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Image / Slide Display */}
        {isImage && currentMedia && (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={currentMedia.url}
              alt={currentMedia.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Fallback Screen when no media is queued */}
        {!currentMedia && (
          <div className="flex flex-col items-center justify-center text-center p-8 z-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
              <Radio className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-slate-200">Régie StreamNet en attente</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4">
              Aucun fichier multimédia chargé. Importez vos vidéos ou musiques pour composer votre conducteur de diffusion.
            </p>
            {onOpenMediaTab && (
              <button
                onClick={onOpenMediaTab}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg shadow-md transition-colors"
              >
                Ouvrir la médiathèque & importer
              </button>
            )}
          </div>
        )}

        {/* OVERLAY: Watermark Logo Top-Right */}
        {overlays.showWatermark && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
            <img
              src={LOGO_ASSET}
              alt="StreamNet Watermark"
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded object-cover"
            />
            <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase font-mono">
              STREAMNET
            </span>
          </div>
        )}

        {/* OVERLAY: Live Program Badge & Clock Top-Left */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {status === 'live' ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-rose-600/90 text-white font-bold text-xs shadow-lg tracking-wider font-mono">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>DIRECT</span>
              <span className="text-rose-200 tabular-nums ml-1 border-l border-rose-400/40 pl-2">
                {formatTimer(uptimeSeconds)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900/90 border border-slate-700 text-slate-300 font-medium text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>HORS DIRECT (APERÇU RÉGIE)</span>
            </div>
          )}

          {overlays.showClock && (
            <div className="hidden sm:flex items-center px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono tabular-nums text-slate-300">
              {currentTimeFormatted}
            </div>
          )}
        </div>

        {/* OVERLAY: Lower Third Graphic (Bottom-Left) */}
        {overlays.showLowerThird && !overlays.showStandbySlate && (
          <div className="absolute bottom-12 left-5 z-10 max-w-md animate-fade-in">
            <div className="bg-slate-950/90 backdrop-blur-md border-l-4 border-cyan-400 px-4 py-2.5 rounded-r-lg shadow-2xl border-y border-r border-slate-800">
              <div className="text-sm font-bold text-white tracking-wide uppercase">
                {overlays.lowerThirdTitle}
              </div>
              <div className="text-xs text-cyan-300/90 font-medium mt-0.5">
                {overlays.lowerThirdSubtitle}
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: News Marquee / Ticker Tape */}
        {overlays.showBannerTicker && !overlays.showStandbySlate && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-slate-950/95 border-t border-cyan-900/40 py-1 px-4 overflow-hidden flex items-center gap-3">
            <div className="shrink-0 bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded">
              INFO STUDIO
            </div>
            <div className="whitespace-nowrap overflow-hidden text-xs text-slate-200 font-medium tracking-wide">
              {overlays.bannerTickerText}
            </div>
          </div>
        )}

        {/* Floating Stereo VU Meter Strip (Right edge) */}
        <div className="absolute right-3 top-16 bottom-16 z-10 w-4 bg-black/70 backdrop-blur-md rounded border border-white/10 p-0.5 flex gap-0.5">
          {/* Left Channel */}
          <div className="w-1.5 h-full bg-slate-900 rounded-sm relative overflow-hidden flex flex-col-reverse">
            <div
              className="w-full transition-all duration-75"
              style={{
                height: `${Math.round(vuLeft * 100)}%`,
                background:
                  vuLeft > 0.85
                    ? 'linear-gradient(to top, #10b981 70%, #f59e0b 85%, #ef4444 100%)'
                    : 'linear-gradient(to top, #10b981 80%, #f59e0b 100%)',
              }}
            />
          </div>
          {/* Right Channel */}
          <div className="w-1.5 h-full bg-slate-900 rounded-sm relative overflow-hidden flex flex-col-reverse">
            <div
              className="w-full transition-all duration-75"
              style={{
                height: `${Math.round(vuRight * 100)}%`,
                background:
                  vuRight > 0.85
                    ? 'linear-gradient(to top, #10b981 70%, #f59e0b 85%, #ef4444 100%)'
                    : 'linear-gradient(to top, #10b981 80%, #f59e0b 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Monitor Bottom Control Bar */}
      <div className="h-10 bg-[#0d1320] border-t border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">PROGRAMME :</span>
            <span className="font-medium text-white truncate max-w-[200px] md:max-w-xs">
              {currentMedia ? currentMedia.name : 'En attente'}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>·</span>
            <span>1080p 60fps</span>
            <span>·</span>
            <span>AAC 48kHz</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Master Volume Slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Rétablir le son du retour' : 'Couper le retour son'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => {
                setMasterVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-16 h-1.5 bg-slate-700 accent-cyan-400 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-[11px] text-slate-400 w-8 tabular-nums">
              {isMuted ? '0%' : `${Math.round(masterVolume * 100)}%`}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran régie'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
