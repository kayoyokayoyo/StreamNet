import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  ShieldAlert,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { StreamStatus, OverlayConfig } from '../types/stream';

interface StreamControlsProps {
  status: StreamStatus;
  onToggleStream: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextMedia: () => void;
  onPrevMedia: () => void;
  onStopMedia: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  overlays: OverlayConfig;
  onToggleStandby: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
  status,
  onToggleStream,
  isPlaying,
  onTogglePlay,
  onNextMedia,
  onPrevMedia,
  onStopMedia,
  currentTime,
  duration,
  onSeek,
  overlays,
  onToggleStandby,
  isMuted,
  onToggleMute,
}) => {
  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const mins = Math.floor(sec / 60);
    const remainingSec = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col gap-4">
      {/* Time Scrubber */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
          <span>{formatSeconds(currentTime)}</span>
          <span className="text-[11px] text-slate-500 font-sans">Avancement de la piste</span>
          <span>{formatSeconds(duration)}</span>
        </div>
        <div
          className="relative w-full h-2 bg-slate-900 rounded-full cursor-pointer overflow-hidden border border-slate-800"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            if (duration > 0) {
              onSeek(ratio * duration);
            }
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-rose-500 transition-all duration-150 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Main Transport & Master Live Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMedia}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850 transition-colors"
            title="Clip précédent"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-950/40 transition-colors"
            title={isPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            onClick={onNextMedia}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-850 transition-colors"
            title="Clip suivant"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onStopMedia}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-850 transition-colors"
            title="Arrêter la lecture"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>

        {/* Emergency Slates & Studio Safeties */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onToggleStandby}
            className={`flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              overlays.showStandbySlate
                ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-750 hover:border-slate-600'
            }`}
            title="Bascule instantanée sur la mire d'attente sans couper le flux YouTube"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{overlays.showStandbySlate ? 'Mire Active' : 'Mire Standby'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-750 hover:border-slate-600'
            }`}
            title="Coupe générale de la piste audio"
          >
            <span>{isMuted ? 'Mute Actif' : 'Mute Général'}</span>
          </button>
        </div>

        {/* Primary Master Stream Button */}
        <div className="w-full sm:w-auto">
          {status === 'live' ? (
            <button
              onClick={onToggleStream}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg shadow-lg shadow-rose-950/50 transition-colors cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>COUPER LE DIRECT YOUTUBE</span>
            </button>
          ) : (
            <button
              onClick={onToggleStream}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 hover:opacity-95 active:scale-[0.98] rounded-lg shadow-lg shadow-red-950/60 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-slate-950" />
              <span>LANCER LE DIRECT YOUTUBE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
