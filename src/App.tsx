import React, { useState, useEffect, useRef } from 'react';
import {
  StreamStatus,
  MediaItem,
  StreamSettings,
  YouTubeChannel,
  OverlayConfig,
  ChatMessage,
} from './types/stream';
import {
  loadSavedChannel,
  saveChannel,
  loadSavedSettings,
  saveSettings,
  loadSavedOverlays,
  saveOverlays,
  DEFAULT_MEDIA_LIST,
  DEFAULT_CHAT_MESSAGES,
} from './services/studioConfig';
import { TopBar } from './components/TopBar';
import { BroadcastMonitor } from './components/BroadcastMonitor';
import { MediaManager } from './components/MediaManager';
import { StreamControls } from './components/StreamControls';
import { AudioMixer } from './components/AudioMixer';
import { TelemetryPanel } from './components/TelemetryPanel';
import { YouTubeAuthModal } from './components/YouTubeAuthModal';
import { LiveChatPanel } from './components/LiveChatPanel';
import { OverlayControls } from './components/OverlayControls';
import { streamRelayInstance } from './services/streamRelay';
import { broadcastCompositor } from './services/broadcastCompositor';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Tv,
  Youtube,
  Plus,
  SlidersHorizontal,
  Film,
  Activity,
  ShieldCheck,
  Wifi,
  Sparkles,
  ArrowLeft,
  Square,
  X,
} from 'lucide-react';

export function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'studio' | 'media' | 'mixer' | 'telemetry' | 'chat' | 'overlays'>('studio');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isStopConfirmModalOpen, setIsStopConfirmModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Broadcast & Channel State (Loaded from localStorage or clean defaults)
  const [status, setStatus] = useState<StreamStatus>('offline');
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [concurrentViewers, setConcurrentViewers] = useState(0);
  const [channel, setChannel] = useState<YouTubeChannel>(loadSavedChannel);
  const [settings, setSettings] = useState<StreamSettings>(loadSavedSettings);
  const [overlays, setOverlays] = useState<OverlayConfig>(loadSavedOverlays);

  // Real-time RTMP Relay telemetry
  const [relayStatusText, setRelayStatusText] = useState<string>('Prêt pour la transmission');
  const [relayBytesSent, setRelayBytesSent] = useState<number>(0);

  // Media & Queue State (Zero demo media)
  const [mediaList, setMediaList] = useState<MediaItem[]>(DEFAULT_MEDIA_LIST);
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [mediaVolume, setMediaVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [continuousLoop, setContinuousLoop] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  // Real Chat State (Zero demo messages)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES);

  // Media Player References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentMedia = mediaList.find((m) => m.id === currentMediaId) || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Automatically save overlays when changed
  useEffect(() => {
    saveOverlays(overlays);
  }, [overlays]);

  // Live Timer & Viewers Counter Simulation
  useEffect(() => {
    let timerInterval: any;
    if (status === 'live') {
      timerInterval = setInterval(() => {
        setUptimeSeconds((prev) => prev + 1);
        setConcurrentViewers((prev) => {
          if (prev === 0) return 42;
          const fluctuation = Math.floor(Math.random() * 5) - 2;
          return Math.max(5, prev + fluctuation);
        });
      }, 1000);
    } else {
      setUptimeSeconds(0);
      setConcurrentViewers(0);
    }
    return () => clearInterval(timerInterval);
  }, [status]);

  // Sync Volume
  useEffect(() => {
    const vol = isMuted ? 0 : masterVolume * mediaVolume * (currentMedia?.gain || 1);
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, vol));
    }
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, [masterVolume, mediaVolume, isMuted, currentMedia]);

  // Handle Play/Pause
  useEffect(() => {
    if (currentMedia?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    if (currentMedia?.type === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentMediaId]);

  // Immediate direct stop function without any blocking window.confirm dialogs
  const handleDirectStopStream = () => {
    try {
      streamRelayInstance.stopStream();
    } catch (e) {
      console.error('Error stopping stream relay:', e);
    }
    try {
      broadcastCompositor.stopLoop();
    } catch (e) {
      console.error('Error stopping compositor:', e);
    }
    setStatus('offline');
    setRelayStatusText('Diffusion arrêtée');
    setIsStopConfirmModalOpen(false);
    showToast('⏹️ Le direct YouTube a été coupé avec succès !');
  };

  // Handle Toggle Stream (Real Go Live / Stop Stream to YouTube)
  const handleToggleStream = async () => {
    if (status === 'connecting') {
      handleDirectStopStream();
      showToast('Tentative de connexion annulée.');
      return;
    }

    if (status === 'live') {
      // Open in-app confirm dialog (unblockable by iframe sandboxes or mobile browsers)
      setIsStopConfirmModalOpen(true);
      return;
    }

    if (status === 'offline') {
      // Validation 1: Real YouTube Stream Key required so YouTube receives video
      if (!settings.streamKey || settings.streamKey.trim() === '') {
        showToast('⚠️ Clé de flux requise pour afficher votre direct sur YouTube Studio.');
        setIsAuthModalOpen(true);
        return;
      }

      // Validation 2: Media required to stream (or standby slate)
      if (mediaList.length === 0 && !overlays.showStandbySlate) {
        showToast('Votre médiathèque est vide. Importez vos vidéos ou musiques à diffuser.');
        setActiveTab('media');
        return;
      }

      setStatus('connecting');
      setRelayStatusText('Connexion au serveur YouTube Ingestion...');
      showToast(`Connexion à YouTube Studio pour ${channel.name || 'votre chaîne'}...`);

      // Start canvas compositor
      const stream = broadcastCompositor.getStream();
      broadcastCompositor.startLoop(
        () => videoRef.current,
        () => null,
        () => ({
          title: overlays.showLowerThird ? overlays.lowerThirdTitle : undefined,
          subtitle: overlays.showLowerThird ? overlays.lowerThirdSubtitle : undefined,
          tickerText: overlays.showBannerTicker ? overlays.bannerTickerText : undefined,
          showStandby: overlays.showStandbySlate,
          watermarkText: overlays.showWatermark ? 'STREAMNET' : undefined,
        })
      );

      // Listen for relay events from FFmpeg
      streamRelayInstance.setEventCallback((event) => {
        if (event.type === 'status') {
          if (event.state === 'connected') {
            setRelayStatusText('Connecté à YouTube — Flux en cours de réception');
            showToast('🎉 YouTube reçoit votre flux vidéo en direct !');
          } else if (event.state === 'starting') {
            setRelayStatusText('Envoi des paquets RTMP...');
          } else if (event.state === 'closed' || event.state === 'stopped') {
            setRelayStatusText('Transmission terminée');
          }
        } else if (event.type === 'stats' && event.bytesSent) {
          setRelayBytesSent(event.bytesSent);
        } else if (event.type === 'error') {
          setRelayStatusText('Erreur transmission');
          showToast(`⚠️ ${event.message}`);
        }
      });

      const started = await streamRelayInstance.startStream(
        stream,
        settings.streamUrl,
        settings.streamKey
      );

      if (started) {
        setStatus('live');
        setIsPlaying(true);
        showToast(`🔴 Le flux vidéo est maintenant transmis vers YouTube Studio !`);
      } else {
        setStatus('offline');
        broadcastCompositor.stopLoop();
      }
    }
  };

  // Media playlist navigation
  const handleNextMedia = () => {
    if (mediaList.length === 0) return;
    const currentIndex = mediaList.findIndex((m) => m.id === currentMediaId);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= mediaList.length) {
      if (continuousLoop) {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    const nextItem = mediaList[nextIndex];
    setCurrentMediaId(nextItem.id);
    setCurrentTime(0);
    setDuration(nextItem.duration);
    setIsPlaying(true);
  };

  const handlePrevMedia = () => {
    if (mediaList.length === 0) return;
    const currentIndex = mediaList.findIndex((m) => m.id === currentMediaId);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = mediaList.length - 1;
    }
    const prevItem = mediaList[prevIndex];
    setCurrentMediaId(prevItem.id);
    setCurrentTime(0);
    setDuration(prevItem.duration);
    setIsPlaying(true);
  };

  const handleMediaEnded = () => {
    if (currentMedia?.isLooping) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else if (autoPlayNext) {
      handleNextMedia();
    } else {
      setIsPlaying(false);
    }
  };

  // Media list operations
  const handleAddMedia = (item: MediaItem) => {
    setMediaList((prev) => [...prev, item]);
    showToast(`Média importé : ${item.name}`);
    if (!currentMediaId) {
      setCurrentMediaId(item.id);
      setDuration(item.duration);
      setIsPlaying(true);
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
    if (currentMediaId === id) {
      const remaining = mediaList.filter((m) => m.id !== id);
      if (remaining.length > 0) {
        setCurrentMediaId(remaining[0].id);
        setDuration(remaining[0].duration);
      } else {
        setCurrentMediaId(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }
    }
  };

  const handleReorderMedia = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;
    const updated = [...mediaList];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setMediaList(updated);
  };

  const handleToggleLoop = (id: string) => {
    setMediaList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isLooping: !item.isLooping } : item
      )
    );
  };

  const handleChangeGain = (id: string, gain: number) => {
    setMediaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, gain } : item))
    );
  };

  const handleSelectMedia = (item: MediaItem) => {
    setCurrentMediaId(item.id);
    setCurrentTime(0);
    setDuration(item.duration);
    setIsPlaying(true);
    showToast(`Diffusion basculée sur : ${item.name}`);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) videoRef.current.currentTime = time;
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  // Chat message send
  const handleSendMessage = (text: string) => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const authorName = channel.name || 'Studio Principal';
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      author: authorName,
      avatarUrl: channel.avatarUrl || '',
      text,
      timestamp: timeFormatted,
      isChannelOwner: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const formattedBytesSent = (relayBytesSent / (1024 * 1024)).toFixed(1);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar adhering to the Top Bar Contract */}
      <TopBar
        status={status}
        uptimeSeconds={uptimeSeconds}
        channel={channel}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleStream={handleToggleStream}
        onOpenSettings={() => setIsAuthModalOpen(true)}
        mediaCount={mediaList.length}
        onDirectStop={handleDirectStopStream}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5 pb-24 lg:pb-8">
        {/* Toast feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-cyan-500/80 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Live Reception Banner for YouTube */}
        {status === 'live' && (
          <div className="bg-gradient-to-r from-red-950/70 via-slate-950 to-emerald-950/70 border-2 border-emerald-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg animate-pulse shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>FLUX VIDÉO EN COURS DE TRANSMISSION VERS YOUTUBE STUDIO</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                    RTMPS SÉCURISÉ (443) ACTIF
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Données transmises : <strong>{formattedBytesSent} Mo</strong> · Statut encodeur : <strong>{relayStatusText}</strong>
                </p>
                <div className="p-2.5 mt-2 bg-slate-950/80 rounded-lg border border-amber-500/40 text-xs text-slate-200">
                  <p className="text-amber-300 font-bold flex items-center gap-1.5">
                    <span>⚠️ Comment afficher votre direct aux spectateurs sur YouTube :</span>
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Sur <strong>YouTube Studio</strong>, l'aperçu vidéo est reçu. Pour que le live soit visible publiquement sur votre chaîne, cliquez sur le bouton bleu <strong>« Passer au direct »</strong> en haut à droite (ou activez « Démarrage automatique » dans les paramètres YouTube).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={handleDirectStopStream}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Couper immédiatement la transmission"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Couper le direct</span>
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-750 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Guide d'aide</span>
              </button>
              <a
                href="https://studio.youtube.com/channel/live"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg transition-all hover:scale-[1.02] whitespace-nowrap"
              >
                <span>Ouvrir YouTube Studio</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Warning Banner when channel or stream key is missing */}
        {(!settings.streamKey || settings.streamKey.trim() === '') && (
          <div className="bg-gradient-to-r from-red-950/50 via-slate-950 to-red-950/30 border border-red-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shrink-0 shadow">
                <Youtube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Configuration requise pour afficher votre direct sur YouTube</span>
                  <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded font-mono">
                    CLÉ YOUTUBE
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Renseignez votre clé de flux YouTube Studio pour que YouTube reçoive votre image et affiche votre live.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-xl shadow-lg transition-all hover:scale-[1.02] whitespace-nowrap self-end sm:self-auto"
            >
              <Youtube className="w-4 h-4 text-slate-950 fill-current" />
              <span>Configurer ma clé YouTube</span>
            </button>
          </div>
        )}

        {/* Universal Back Arrow Header for All Subpages */}
        {activeTab !== 'studio' && (
          <div className="flex items-center justify-between bg-[#0e1422] border border-slate-800 rounded-xl px-4 py-3 shadow-lg animate-fade-in">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-white rounded-xl text-xs font-bold transition-all hover:-translate-x-1 shadow-md group cursor-pointer shrink-0"
              title="Retourner au Dashboard Régie"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span className="hidden sm:inline">← Retour au Dashboard (Régie Direct)</span>
              <span className="sm:hidden">← Retour Régie</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                  {activeTab === 'media' && 'Médiathèque & Playlist'}
                  {activeTab === 'mixer' && 'Table de Mixage Audio'}
                  {activeTab === 'telemetry' && 'Télémétrie & Flux'}
                  {activeTab === 'chat' && 'Chat YouTube en Direct'}
                  {activeTab === 'overlays' && 'Habillages & Synthés'}
                </span>
              </span>
              {status === 'live' ? (
                <span className="bg-red-950 text-red-300 border border-red-800 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold animate-pulse">
                  🔴 DIFFUSION EN DIRECT
                </span>
              ) : (
                <span className="bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-lg font-mono text-[11px]">
                  HORS DIRECT
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 1: Main Studio (Régie Direct) */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 columns: Live Program Monitor + Stream Controls */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              <BroadcastMonitor
                currentMedia={currentMedia}
                status={status}
                uptimeSeconds={uptimeSeconds}
                overlays={overlays}
                masterVolume={masterVolume}
                setMasterVolume={setMasterVolume}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                onMediaEnded={handleMediaEnded}
                onTimeUpdate={(c, d) => {
                  setCurrentTime(c);
                  if (d) setDuration(d);
                }}
                videoRef={videoRef}
                audioRef={audioRef}
                isPlaying={isPlaying}
                onOpenMediaTab={() => setActiveTab('media')}
              />

              <StreamControls
                status={status}
                onToggleStream={handleToggleStream}
                isPlaying={isPlaying}
                onTogglePlay={() => {
                  if (!currentMedia && mediaList.length > 0) {
                    setCurrentMediaId(mediaList[0].id);
                    setDuration(mediaList[0].duration);
                  }
                  setIsPlaying(!isPlaying);
                }}
                onNextMedia={handleNextMedia}
                onPrevMedia={handlePrevMedia}
                onStopMedia={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                  if (videoRef.current) videoRef.current.currentTime = 0;
                  if (audioRef.current) audioRef.current.currentTime = 0;
                }}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                overlays={overlays}
                onToggleStandby={() =>
                  setOverlays((prev) => ({
                    ...prev,
                    showStandbySlate: !prev.showStandbySlate,
                  }))
                }
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
              />

              {/* Studio Quick Switcher Strip */}
              <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                    <Tv className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white truncate max-w-xs">
                      {settings.broadcastTitle || (channel.name ? `Direct — ${channel.name}` : 'Titre du direct')}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {channel.isConnected || settings.streamKey ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chaîne : {channel.name || 'YouTube Studio'} · RTMPS Sécurisé (443)</span>
                        </span>
                      ) : (
                        <span className="text-amber-400">Chaîne YouTube non connectée</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Studio Tools Shortcuts */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('media')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Film className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Médiathèque ({mediaList.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('mixer')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Table Audio</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('telemetry')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Télémétrie</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 4 columns: Live Chat & Telemetry Snapshot */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <LiveChatPanel
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                channel={channel}
                isLive={status === 'live'}
              />
            </div>
          </div>
        )}

        {/* Tab Content 2: Médiathèque */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <MediaManager
              mediaList={mediaList}
              currentMediaId={currentMediaId}
              onSelectMedia={handleSelectMedia}
              onAddMedia={handleAddMedia}
              onRemoveMedia={handleRemoveMedia}
              onReorderMedia={handleReorderMedia}
              onToggleLoop={handleToggleLoop}
              onChangeGain={handleChangeGain}
              continuousLoop={continuousLoop}
              setContinuousLoop={setContinuousLoop}
              autoPlayNext={autoPlayNext}
              setAutoPlayNext={setAutoPlayNext}
              onGoToDashboard={() => setActiveTab('studio')}
            />
          </div>
        )}

        {/* Tab Content 3: Mixeur Audio Régie */}
        {activeTab === 'mixer' && (
          <div className="space-y-6">
            <AudioMixer
              masterVolume={masterVolume}
              setMasterVolume={setMasterVolume}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              mediaVolume={mediaVolume}
              setMediaVolume={setMediaVolume}
              isPlaying={isPlaying}
              onGoBack={() => setActiveTab('studio')}
            />
          </div>
        )}

        {/* Tab Content 4: Télémétrie & Diagnostic */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <TelemetryPanel
              status={status}
              uptimeSeconds={uptimeSeconds}
              targetBitrate={settings.targetBitrate}
              concurrentViewers={concurrentViewers}
              onGoBack={() => setActiveTab('studio')}
            />
          </div>
        )}

        {/* Tab Content 5: Chat YouTube */}
        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <LiveChatPanel
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              channel={channel}
              isLive={status === 'live'}
              onGoBack={() => setActiveTab('studio')}
            />
          </div>
        )}

        {/* Tab Content 6: Habillages */}
        {activeTab === 'overlays' && (
          <div className="space-y-6">
            <OverlayControls
              overlays={overlays}
              setOverlays={setOverlays}
              onGoBack={() => setActiveTab('studio')}
            />
          </div>
        )}
      </main>

      {/* YouTube Direct Authentication & Stream Key Modal */}
      <YouTubeAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        channel={channel}
        setChannel={setChannel}
        settings={settings}
        setSettings={setSettings}
        onConnectedSuccess={() => {
          showToast(`Liaison YouTube Studio configurée avec succès !`);
        }}
      />

      {/* In-App Confirmation Modal for Stopping Stream (never blocked by iframe sandbox) */}
      {isStopConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e1422] border-2 border-rose-600/70 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsStopConfirmModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-500 shrink-0">
                <Square className="w-6 h-6 fill-current animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Couper le direct YouTube ?</h3>
                <p className="text-xs text-rose-400 font-mono mt-0.5">
                  🔴 FLUX EN COURS DE TRANSMISSION
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Êtes-vous sûr de vouloir couper la diffusion en direct sur votre chaîne{' '}
              <strong className="text-white">{channel.name || 'YouTube'}</strong> ? Le flux
              RTMPS vers YouTube Studio sera immédiatement arrêté.
            </p>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 mb-5 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Durée live</span>
                <span className="font-mono font-bold text-white">
                  {Math.floor(uptimeSeconds / 60)} min {uptimeSeconds % 60} s
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Données envoyées</span>
                <span className="font-mono font-bold text-emerald-400">{formattedBytesSent} Mo</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Protocole</span>
                <span className="font-mono text-cyan-400">RTMPS 443</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => setIsStopConfirmModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-750 transition-colors cursor-pointer text-center"
              >
                Continuer la diffusion
              </button>
              <button
                onClick={handleDirectStopStream}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-lg shadow-rose-950/50 transition-all cursor-pointer text-center"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Confirmer et Couper le direct</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
