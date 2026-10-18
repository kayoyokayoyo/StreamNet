import React from 'react';
import { Layers, Type, Sparkles, Image as ImageIcon, Clock, Radio, ToggleLeft, ToggleRight } from 'lucide-react';
import { OverlayConfig } from '../types/stream';

interface OverlayControlsProps {
  overlays: OverlayConfig;
  setOverlays: React.Dispatch<React.SetStateAction<OverlayConfig>>;
  onGoBack?: () => void;
}

export const OverlayControls: React.FC<OverlayControlsProps> = ({
  overlays,
  setOverlays,
  onGoBack,
}) => {
  return (
    <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
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
              <Layers className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Habillage Graphique & Synthés du Direct
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personnalisez les bandeaux, incrustations de logo, tickers et synthés affichés en surimpression de votre flux.
            </p>
          </div>
        </div>
      </div>

      {/* Toggles and Text inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lower Third Synthé */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Bandeau Synthé (Lower Third)</span>
            </div>
            <button
              onClick={() =>
                setOverlays({ ...overlays, showLowerThird: !overlays.showLowerThird })
              }
              className="text-xs text-slate-300 font-medium flex items-center gap-1.5"
            >
              {overlays.showLowerThird ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <ToggleRight className="w-5 h-5" /> Affiché
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1 font-semibold">
                  <ToggleLeft className="w-5 h-5" /> Masqué
                </span>
              )}
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Titre principal du synthé
            </label>
            <input
              type="text"
              value={overlays.lowerThirdTitle}
              onChange={(e) =>
                setOverlays({ ...overlays, lowerThirdTitle: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Sous-titre / Information
            </label>
            <input
              type="text"
              value={overlays.lowerThirdSubtitle}
              onChange={(e) =>
                setOverlays({ ...overlays, lowerThirdSubtitle: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Marquee Banner Ticker */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold text-white">Bandeau Défilant (Ticker Info)</span>
            </div>
            <button
              onClick={() =>
                setOverlays({ ...overlays, showBannerTicker: !overlays.showBannerTicker })
              }
              className="text-xs text-slate-300 font-medium flex items-center gap-1.5"
            >
              {overlays.showBannerTicker ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <ToggleRight className="w-5 h-5" /> Affiché
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1 font-semibold">
                  <ToggleLeft className="w-5 h-5" /> Masqué
                </span>
              )}
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Texte du bandeau d'actualités / annonce
            </label>
            <textarea
              rows={3}
              value={overlays.bannerTickerText}
              onChange={(e) =>
                setOverlays({ ...overlays, bannerTickerText: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
        </div>

        {/* Watermark Logo */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white">Logo / Filigrane Studio</span>
              <p className="text-[11px] text-slate-400">
                Affiche l'insigne officiel StreamNet en haut à droite
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setOverlays({ ...overlays, showWatermark: !overlays.showWatermark })
            }
          >
            {overlays.showWatermark ? (
              <ToggleRight className="w-6 h-6 text-cyan-400" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>

        {/* Live Clock */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white">Horloge Régie (UTC / Local)</span>
              <p className="text-[11px] text-slate-400">
                Affiche l'horodatage officiel de la régie sur le retour
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setOverlays({ ...overlays, showClock: !overlays.showClock })
            }
          >
            {overlays.showClock ? (
              <ToggleRight className="w-6 h-6 text-amber-400" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
