import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  Users,
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { StreamHealth, StreamStatus } from '../types/stream';

interface TelemetryPanelProps {
  status: StreamStatus;
  uptimeSeconds: number;
  targetBitrate: number;
  concurrentViewers: number;
  onGoBack?: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  status,
  uptimeSeconds,
  targetBitrate,
  concurrentViewers,
  onGoBack,
}) => {
  const [currentBitrate, setCurrentBitrate] = useState(targetBitrate);
  const [fps, setFps] = useState(59.94);
  const [bitrateHistory, setBitrateHistory] = useState<number[]>(() =>
    Array(24).fill(targetBitrate)
  );

  // Simulate real network telemetry variations when live
  useEffect(() => {
    if (status !== 'live') {
      setCurrentBitrate(0);
      setFps(0);
      return;
    }

    const interval = setInterval(() => {
      // Small jitter ±3% representing healthy network packet dispatch
      const jitter = (Math.random() - 0.48) * 120;
      const newBitrate = Math.round(targetBitrate + jitter);
      setCurrentBitrate(newBitrate);

      // Realistic 59.94 - 60.0 fps
      const fpsJitter = (Math.random() - 0.5) * 0.1;
      setFps(parseFloat((59.94 + fpsJitter).toFixed(2)));

      setBitrateHistory((prev) => [...prev.slice(1), newBitrate]);
    }, 1500);

    return () => clearInterval(interval);
  }, [status, targetBitrate]);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Sparkline coordinates
  const minB = targetBitrate - 400;
  const maxB = targetBitrate + 400;
  const points = bitrateHistory
    .map((val, idx) => {
      const x = (idx / (bitrateHistory.length - 1)) * 100;
      const normalized = Math.max(0, Math.min(1, (val - minB) / (maxB - minB)));
      const y = 100 - normalized * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');

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
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Télémétrie en Direct & Diagnostic Réseau
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Surveillance continue des paquets RTMP, stabilité des images et santé du serveur YouTube.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {status === 'live' ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/70 border border-emerald-600/70 rounded-lg text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SIGNAL TRANSMIS PARFAIT</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-750 rounded-lg text-slate-400 text-xs">
              <span>HORS DIRECT</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Key Telemetry Figures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Débit Binaire */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Débit Binaire</span>
            <Wifi className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tabular-nums text-white">
              {status === 'live' ? `${currentBitrate.toLocaleString('fr-FR')}` : '0'}
              <span className="text-xs font-sans text-slate-400 font-normal ml-1">kbps</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
              {status === 'live' ? 'Cible : ' + targetBitrate + ' kbps (Stable)' : 'En attente'}
            </div>
          </div>
        </div>

        {/* Fréquence d'Images (FPS) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Fréquence d'images</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tabular-nums text-white">
              {status === 'live' ? `${fps}` : '0'}
              <span className="text-xs font-sans text-slate-400 font-normal ml-1">fps</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {status === 'live' ? 'Images perdues : 0 (0.0%)' : 'Standby'}
            </div>
          </div>
        </div>

        {/* Spectateurs YouTube */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Spectateurs Direct</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tabular-nums text-white">
              {status === 'live' ? `${concurrentViewers.toLocaleString('fr-FR')}` : '0'}
            </div>
            <div className="text-[11px] text-cyan-400 font-medium mt-0.5">
              {status === 'live' ? 'Pic : ' + (concurrentViewers + 214) : 'Flux inactif'}
            </div>
          </div>
        </div>

        {/* Temps d'antenne */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Temps d'Antenne</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tabular-nums text-white">
              {formatUptime(uptimeSeconds)}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
              {status === 'live' ? 'Diffusion ininterrompue' : 'Hors antenne'}
            </div>
          </div>
        </div>
      </div>

      {/* Bitrate Transmission Graph */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">Graphique de Débit de Transmission RTMP</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px] tabular-nums">
            Échantillonnage : 1.5s
          </span>
        </div>

        {/* SVG Sparkline */}
        <div className="relative w-full h-24 bg-slate-900/60 rounded border border-slate-850 overflow-hidden">
          {status === 'live' ? (
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="bitrateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${points} 100,100`}
                fill="url(#bitrateGradient)"
              />
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Le graphique démarrera dès le lancement du flux en direct
            </div>
          )}
        </div>
      </div>

      {/* Encoder Profile Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Encodeur Vidéo Studio
          </span>
          <div className="flex justify-between text-slate-300">
            <span>Codec & Profil :</span>
            <span className="font-mono text-white">H.264 / AVC (High 4.2)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Résolution native :</span>
            <span className="font-mono text-white">1920 × 1080 (16:9)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Intervalle images clés (GOP) :</span>
            <span className="font-mono text-white">2.0 secondes</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Encodeur Audio Studio
          </span>
          <div className="flex justify-between text-slate-300">
            <span>Codec Audio :</span>
            <span className="font-mono text-white">AAC-LC (Stéréo)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Taux d'échantillonnage :</span>
            <span className="font-mono text-white">48 000 Hz</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Débit Audio Alloué :</span>
            <span className="font-mono text-white">320 kbps constant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
