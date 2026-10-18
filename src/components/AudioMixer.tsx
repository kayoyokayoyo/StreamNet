import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Volume2,
  VolumeX,
  Mic,
  Music,
  Radio,
  Headphones,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

interface AudioMixerProps {
  masterVolume: number;
  setMasterVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  mediaVolume: number;
  setMediaVolume: (v: number) => void;
  isPlaying: boolean;
  onGoBack?: () => void;
}

export const AudioMixer: React.FC<AudioMixerProps> = ({
  masterVolume,
  setMasterVolume,
  isMuted,
  setIsMuted,
  mediaVolume,
  setMediaVolume,
  isPlaying,
  onGoBack,
}) => {
  const [micVolume, setMicVolume] = useState(0.8);
  const [micMuted, setMicMuted] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(0.65);
  const [sfxMuted, setSfxMuted] = useState(false);

  // Meter levels with realistic audio dynamics
  const [levels, setLevels] = useState({
    mediaL: 0.7,
    mediaR: 0.65,
    micL: 0.5,
    micR: 0.52,
    sfxL: 0.2,
    sfxR: 0.18,
    masterL: 0.75,
    masterR: 0.72,
  });

  useEffect(() => {
    if (!isPlaying) {
      setLevels({
        mediaL: 0.02,
        mediaR: 0.02,
        micL: micMuted ? 0.01 : micVolume * 0.4,
        micR: micMuted ? 0.01 : micVolume * 0.38,
        sfxL: 0.01,
        sfxR: 0.01,
        masterL: micMuted ? 0.02 : micVolume * 0.35,
        masterR: micMuted ? 0.02 : micVolume * 0.33,
      });
      return;
    }

    const interval = setInterval(() => {
      const baseM = isMuted ? 0 : mediaVolume * 0.75;
      const baseMic = micMuted ? 0 : micVolume * 0.6;
      const baseSfx = sfxMuted ? 0 : sfxVolume * 0.3;

      const rnd = () => (Math.random() - 0.5) * 0.2;

      const mL = Math.max(0.02, Math.min(0.96, baseM + rnd()));
      const mR = Math.max(0.02, Math.min(0.96, baseM + rnd()));
      const micL = Math.max(0.02, Math.min(0.92, baseMic + rnd() * 0.5));
      const micR = Math.max(0.02, Math.min(0.92, baseMic + rnd() * 0.5));

      const mastL = Math.max(0.02, Math.min(0.98, (mL * 0.65 + micL * 0.35) * masterVolume));
      const mastR = Math.max(0.02, Math.min(0.98, (mR * 0.65 + micR * 0.35) * masterVolume));

      setLevels({
        mediaL: isMuted ? 0.01 : mL,
        mediaR: isMuted ? 0.01 : mR,
        micL,
        micR,
        sfxL: baseSfx,
        sfxR: baseSfx,
        masterL: isMuted ? 0.01 : mastL,
        masterR: isMuted ? 0.01 : mastR,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isMuted, mediaVolume, masterVolume, micMuted, micVolume, sfxMuted, sfxVolume]);

  const renderMeter = (level: number) => {
    const percent = Math.round(level * 100);
    return (
      <div className="w-2.5 h-36 bg-slate-900 rounded-sm overflow-hidden flex flex-col-reverse border border-slate-800 p-0.5">
        <div
          className="w-full transition-all duration-75 rounded-xs"
          style={{
            height: `${percent}%`,
            background:
              level > 0.85
                ? 'linear-gradient(to top, #10b981 60%, #f59e0b 80%, #ef4444 100%)'
                : 'linear-gradient(to top, #10b981 75%, #f59e0b 100%)',
          }}
        />
      </div>
    );
  };

  return (
    <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all hover:-translate-x-0.5"
              title="Retourner à la régie"
            >
              <span>← Retour Régie</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Table de Mixage & Régie Audio Studio
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Contrôle multicanal en temps réel pour vos médias, micro régie et master de diffusion YouTube.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-750'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'Mute Master Actif' : 'Mute Général'}</span>
          </button>
        </div>
      </div>

      {/* 4 Fader Channels Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Channel 1: Média Régie (Vidéo/Audio PGM) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Music className="w-4 h-4" />
            <span>Piste Média</span>
          </div>

          <div className="flex items-center gap-2">
            {renderMeter(levels.mediaL)}
            {renderMeter(levels.mediaR)}
          </div>

          {/* Vertical Fader Slider */}
          <div className="w-full flex flex-col items-center gap-1.5">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : mediaVolume}
              onChange={(e) => {
                setMediaVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-28 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-xs tabular-nums text-slate-300">
              {Math.round(mediaVolume * 100)}%
            </span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-full py-1 text-[11px] font-semibold rounded border transition-colors ${
              isMuted
                ? 'bg-rose-900/50 text-rose-300 border-rose-700'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            {isMuted ? 'MUTÉ' : 'MUTE'}
          </button>
        </div>

        {/* Channel 2: Micro Studio */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Mic className="w-4 h-4" />
            <span>Micro Studio</span>
          </div>

          <div className="flex items-center gap-2">
            {renderMeter(levels.micL)}
            {renderMeter(levels.micR)}
          </div>

          <div className="w-full flex flex-col items-center gap-1.5">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={micMuted ? 0 : micVolume}
              onChange={(e) => {
                setMicVolume(parseFloat(e.target.value));
                if (micMuted) setMicMuted(false);
              }}
              className="w-28 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-xs tabular-nums text-slate-300">
              {Math.round(micVolume * 100)}%
            </span>
          </div>

          <button
            onClick={() => setMicMuted(!micMuted)}
            className={`w-full py-1 text-[11px] font-semibold rounded border transition-colors ${
              micMuted
                ? 'bg-rose-900/50 text-rose-300 border-rose-700'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            {micMuted ? 'MUTÉ' : 'MUTE'}
          </button>
        </div>

        {/* Channel 3: Habillage / Jingles */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Jingles & FX</span>
          </div>

          <div className="flex items-center gap-2">
            {renderMeter(levels.sfxL)}
            {renderMeter(levels.sfxR)}
          </div>

          <div className="w-full flex flex-col items-center gap-1.5">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sfxMuted ? 0 : sfxVolume}
              onChange={(e) => {
                setSfxVolume(parseFloat(e.target.value));
                if (sfxMuted) setSfxMuted(false);
              }}
              className="w-28 accent-indigo-400 cursor-pointer"
            />
            <span className="font-mono text-xs tabular-nums text-slate-300">
              {Math.round(sfxVolume * 100)}%
            </span>
          </div>

          <button
            onClick={() => setSfxMuted(!sfxMuted)}
            className={`w-full py-1 text-[11px] font-semibold rounded border transition-colors ${
              sfxMuted
                ? 'bg-rose-900/50 text-rose-300 border-rose-700'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
          >
            {sfxMuted ? 'MUTÉ' : 'MUTE'}
          </button>
        </div>

        {/* Channel 4: Master PGM Antenne */}
        <div className="bg-slate-950 border-2 border-red-500/40 rounded-xl p-4 flex flex-col items-center gap-3 shadow-lg shadow-red-950/30">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase">
            <Radio className="w-4 h-4 text-red-500" />
            <span>Master YouTube</span>
          </div>

          <div className="flex items-center gap-2">
            {renderMeter(levels.masterL)}
            {renderMeter(levels.masterR)}
          </div>

          <div className="w-full flex flex-col items-center gap-1.5">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => {
                setMasterVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-28 accent-rose-500 cursor-pointer"
            />
            <span className="font-mono text-xs tabular-nums text-white font-bold">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          <div className="w-full text-center py-1 bg-red-950/60 border border-red-800 rounded text-[10px] text-red-300 font-mono font-bold">
            SORTIE DIFFUSION
          </div>
        </div>
      </div>
    </div>
  );
};
