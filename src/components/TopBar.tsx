import React, { useState } from 'react';
import {
  Radio,
  AlertCircle,
  CheckCircle2,
  Youtube,
  Settings,
  Menu,
  X,
  Tv,
  Film,
  SlidersHorizontal,
  Activity,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Square,
  Play,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { StreamStatus, YouTubeChannel } from '../types/stream';

interface TopBarProps {
  status: StreamStatus;
  uptimeSeconds: number;
  channel: YouTubeChannel;
  activeTab: 'studio' | 'media' | 'mixer' | 'telemetry' | 'chat' | 'overlays';
  setActiveTab: (tab: 'studio' | 'media' | 'mixer' | 'telemetry' | 'chat' | 'overlays') => void;
  onToggleStream: () => void;
  onOpenSettings: () => void;
  mediaCount?: number;
  onDirectStop?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  status,
  uptimeSeconds,
  channel,
  activeTab,
  setActiveTab,
  onToggleStream,
  onOpenSettings,
  mediaCount = 0,
  onDirectStop,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const navItems = [
    {
      id: 'studio' as const,
      label: 'Régie Direct',
      shortLabel: 'Régie',
      desc: 'Moniteur et dashboard principal',
      icon: Tv,
      color: 'text-cyan-400',
    },
    {
      id: 'media' as const,
      label: 'Médiathèque',
      shortLabel: 'Médias',
      desc: 'Gestion des vidéos et musiques',
      icon: Film,
      color: 'text-cyan-400',
      badge: mediaCount > 0 ? `${mediaCount}` : undefined,
    },
    {
      id: 'mixer' as const,
      label: 'Mixeur Audio',
      shortLabel: 'Audio',
      desc: 'Master volume et retours son',
      icon: SlidersHorizontal,
      color: 'text-amber-400',
    },
    {
      id: 'telemetry' as const,
      label: 'Télémétrie',
      shortLabel: 'Télémétrie',
      desc: 'Débit RTMPS, FPS et diagnostic',
      icon: Activity,
      color: 'text-emerald-400',
    },
    {
      id: 'chat' as const,
      label: 'Chat YouTube',
      shortLabel: 'Chat',
      desc: 'Modération des spectateurs',
      icon: MessageSquare,
      color: 'text-rose-400',
    },
    {
      id: 'overlays' as const,
      label: 'Habillages',
      shortLabel: 'Habillages',
      desc: 'Mires, titrages et synthés',
      icon: Sparkles,
      color: 'text-purple-400',
    },
  ];

  const handleNavClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 transition-all">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8 max-w-7xl mx-auto">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('studio')}
              className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-rose-600 flex items-center justify-center shadow-lg shadow-cyan-900/20 group-hover:scale-105 transition-transform">
                <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <span>StreamNet</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-cyan-400 uppercase bg-cyan-950/70 border border-cyan-800/60 px-1.5 py-0.5 rounded hidden xs:inline-block">
                    PRO
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium text-slate-300">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white py-1 relative cursor-pointer ${
                    isActive ? 'text-cyan-400 font-semibold' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Live Indicator Chip (Visible on mobile & desktop when live) */}
            {status === 'live' && (
              <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-600/60 px-2 sm:px-2.5 py-1 rounded-lg text-red-200 text-xs font-mono font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[11px] hidden sm:inline">LIVE</span>
                <span className="text-[11px] tabular-nums">{formatUptime(uptimeSeconds)}</span>
              </div>
            )}

            {/* YouTube Account / Connection Button */}
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs transition-colors whitespace-nowrap cursor-pointer ${
                channel.isConnected && channel.name
                  ? 'bg-slate-900/90 border-emerald-600/60 text-slate-200 hover:border-emerald-500'
                  : 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-md shadow-red-950/40 font-semibold'
              }`}
              title="Connexion et statut YouTube Studio"
            >
              <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 fill-current" />
              <span className="font-semibold max-w-[90px] sm:max-w-[130px] truncate hidden xs:inline">
                {channel.isConnected && channel.name ? channel.name : 'YouTube'}
              </span>
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
            </button>

            {/* Primary Action Button (Desktop & Compact Mobile) */}
            {status === 'live' ? (
              <button
                onClick={onToggleStream}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg shadow-lg shadow-rose-950/40 transition-colors whitespace-nowrap cursor-pointer"
                title="Couper la diffusion en direct sur YouTube"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">ARRÊTER LE DIRECT</span>
                <span className="sm:hidden">COUPER</span>
              </button>
            ) : status === 'connecting' ? (
              <button
                onClick={onToggleStream}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-amber-200 bg-amber-900/70 hover:bg-amber-800 border border-amber-600/60 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
                title="Cliquer pour annuler la connexion"
              >
                <AlertCircle className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">CONNEXION... (ANNULER)</span>
                <span className="sm:hidden">ANNULER</span>
              </button>
            ) : (
              <button
                onClick={onToggleStream}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 rounded-lg shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
                title="Lancer le direct sur YouTube"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">DIFFUSER EN DIRECT</span>
                <span className="sm:hidden">DIRECT</span>
              </button>
            )}

            {/* Mobile Menu Burger Toggle Button ("Menu Ouvre/Ferme") */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 hover:text-white transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu régie'}
              title={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-cyan-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation ("Menu Ouvre / Ferme") */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col animate-fade-in">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md ml-auto h-full bg-[#0b101c] border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-rose-600 flex items-center justify-center text-white">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Menu Régie StreamNet</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                      PRO
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Navigation & Contrôles mobiles</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* YouTube Account Status Card in Drawer */}
            <div className="p-4 bg-slate-900/60 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500 fill-current" />
                  <span className="text-xs font-bold text-white">Compte YouTube Direct</span>
                </div>
                {channel.isConnected ? (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Liaison Active</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded font-medium">
                    Non connecté
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 mb-3 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">
                    {channel.name || 'Aucune chaîne configurée'}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    RTMPS Sécurisé : port 443
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700"
                >
                  Configurer
                </button>
              </div>

              {/* Direct Link to YouTube Live Studio */}
              <a
                href="https://studio.youtube.com/channel/live"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-800 transition-colors"
              >
                <span>Ouvrir YouTube Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Quick Master Live Control in Drawer */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Contrôle Diffusion
              </div>
              {status === 'live' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs bg-red-950/40 border border-red-700/50 p-2.5 rounded-lg">
                    <span className="text-red-200 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      EN DIRECT SUR YOUTUBE
                    </span>
                    <span className="font-mono text-red-300 font-bold">{formatUptime(uptimeSeconds)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onToggleStream();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-lg transition-colors"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>COUPER LE DIRECT YOUTUBE</span>
                  </button>
                </div>
              ) : status === 'connecting' ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onToggleStream();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-amber-200 bg-amber-900/80 rounded-xl border border-amber-600/60"
                >
                  <AlertCircle className="w-4 h-4 animate-spin" />
                  <span>CONNEXION EN COURS (CLIQUER POUR ANNULER)</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onToggleStream();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 rounded-xl shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>LANCER LE DIRECT YOUTUBE</span>
                </button>
              )}
            </div>

            {/* Navigation List */}
            <div className="p-4 flex-1 space-y-1.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Pages & Espaces de Travail
              </div>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-cyan-950/70 border border-cyan-500/60 text-white shadow-md'
                        : 'bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] font-mono font-bold bg-cyan-900 text-cyan-300 px-1.5 py-0.2 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Quick return button in drawer if not on studio */}
            {activeTab !== 'studio' && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 sticky bottom-0">
                <button
                  onClick={() => handleNavClick('studio')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                >
                  <span>← Revenir au Dashboard Régie</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar ("Navarin / Barre Rapide Pouce") */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#080d18]/95 backdrop-blur-xl border-t border-slate-800/90 py-1.5 px-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => handleNavClick('studio')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'studio' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-4.5 h-4.5" />
          <span className="text-[10px]">Régie</span>
        </button>

        <button
          onClick={() => handleNavClick('media')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors relative cursor-pointer ${
            activeTab === 'media' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-4.5 h-4.5" />
          <span className="text-[10px]">Médias</span>
          {mediaCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleNavClick('mixer')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'mixer' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4.5 h-4.5" />
          <span className="text-[10px]">Audio</span>
        </button>

        <button
          onClick={() => handleNavClick('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'chat' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span className="text-[10px]">Chat</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
            isMobileMenuOpen ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-4.5 h-4.5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>
    </>
  );
};
