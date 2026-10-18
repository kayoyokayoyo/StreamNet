import React, { useState } from 'react';
import {
  X,
  Youtube,
  Key,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sliders,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { YouTubeChannel, StreamSettings } from '../types/stream';
import { saveChannel, saveSettings } from '../services/studioConfig';

interface YouTubeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: YouTubeChannel;
  setChannel: React.Dispatch<React.SetStateAction<YouTubeChannel>>;
  settings: StreamSettings;
  setSettings: React.Dispatch<React.SetStateAction<StreamSettings>>;
}

export const YouTubeSettingsModal: React.FC<YouTubeSettingsModalProps> = ({
  isOpen,
  onClose,
  channel,
  setChannel,
  settings,
  setSettings,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [channelInput, setChannelInput] = useState(channel.name || '');
  const [handleInput, setHandleInput] = useState(channel.handle || '');
  const [streamKeyInput, setStreamKeyInput] = useState(settings.streamKey || '');
  const [broadcastTitleInput, setBroadcastTitleInput] = useState(settings.broadcastTitle || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSaveConnection = () => {
    if (!channelInput.trim()) {
      setValidationError('Veuillez indiquer le nom de votre chaîne YouTube.');
      return;
    }
    if (!streamKeyInput.trim()) {
      setValidationError('Veuillez renseigner votre clé de flux YouTube (Stream Key) pour permettre la diffusion.');
      return;
    }

    const updatedChannel: YouTubeChannel = {
      ...channel,
      name: channelInput.trim(),
      handle: handleInput.trim().startsWith('@') ? handleInput.trim() : handleInput.trim() ? `@${handleInput.trim()}` : '@studio',
      isConnected: true,
      liveStreamingEnabled: true,
      subscribersFormatted: channel.subscribersFormatted || 'Chaîne active',
    };

    const updatedSettings: StreamSettings = {
      ...settings,
      streamKey: streamKeyInput.trim(),
      broadcastTitle: broadcastTitleInput.trim() || `Direct Studio YouTube — ${channelInput.trim()}`,
    };

    setChannel(updatedChannel);
    setSettings(updatedSettings);
    saveChannel(updatedChannel);
    saveSettings(updatedSettings);
    setValidationError(null);
    onClose();
  };

  const handleDisconnectChannel = () => {
    const confirmDisconnect = window.confirm(
      'Voulez-vous vraiment déconnecter votre chaîne et réinitialiser les identifiants de streaming ?'
    );
    if (!confirmDisconnect) return;

    const clearedChannel: YouTubeChannel = {
      id: '',
      name: '',
      handle: '',
      avatarUrl: '',
      subscribersFormatted: '',
      isConnected: false,
      liveStreamingEnabled: false,
      authType: 'oauth',
    };

    const clearedSettings: StreamSettings = {
      ...settings,
      streamKey: '',
      broadcastTitle: '',
    };

    setChannel(clearedChannel);
    setSettings(clearedSettings);
    saveChannel(clearedChannel);
    saveSettings(clearedSettings);
    setChannelInput('');
    setHandleInput('');
    setStreamKeyInput('');
    setBroadcastTitleInput('');
    setValidationError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Youtube className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Connexion Chaîne YouTube & Diffusion Direct
              </h2>
              <p className="text-xs text-slate-400">
                Connectez votre véritable chaîne pour diffuser vos flux en direct
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-red-500 shrink-0">
                <Youtube className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {channel.isConnected && channel.name ? channel.name : 'Aucune chaîne connectée'}
                  </h3>
                  {channel.isConnected ? (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-medium">
                      Connectée
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded font-medium">
                      Déconnectée
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>{channel.isConnected && channel.handle ? channel.handle : 'Non configurée'}</span>
                  <span>·</span>
                  <span>
                    {settings.streamKey ? 'Clé de flux configurée' : 'Clé de flux manquante'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {channel.isConnected && (
                <button
                  onClick={handleDisconnectChannel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 transition-colors"
                  title="Déconnecter cette chaîne"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Déconnecter</span>
                </button>
              )}
              <a
                href="https://studio.youtube.com/channel/live"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 transition-colors"
                title="Ouvrir la régie YouTube Live"
              >
                <span>YouTube Studio</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 flex items-start gap-3 text-xs text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-cyan-300">
                Comment connecter votre vraie chaîne YouTube :
              </span>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px]">
                <li>Ouvrez <a href="https://studio.youtube.com/channel/live" target="_blank" rel="noreferrer" className="underline text-cyan-400 hover:text-cyan-300">YouTube Studio Direct</a> dans votre navigateur.</li>
                <li>Dans l'onglet « Paramètres du flux », copiez votre <strong>Clé de flux</strong>.</li>
                <li>Collez votre clé ci-dessous et validez pour autoriser la diffusion directe depuis votre régie StreamNet.</li>
              </ol>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Identifiants de votre chaîne YouTube</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nom de votre chaîne YouTube *
                </label>
                <input
                  type="text"
                  placeholder="Ex : Ma Chaîne Studio, MarketNet TV..."
                  value={channelInput}
                  onChange={(e) => {
                    setChannelInput(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Identifiant / Poignée (@handle)
                </label>
                <input
                  type="text"
                  placeholder="Ex : @marketnet243"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Stream Key */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Clé de flux YouTube (Stream Key) *
              </label>
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="Collez votre clé de flux YouTube Studio ici..."
                    value={streamKeyInput}
                    onChange={(e) => {
                      setStreamKeyInput(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {streamKeyInput && (
                  <button
                    onClick={() => copyToClipboard(streamKeyInput, false)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="Copier la clé"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Ingestion Server */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Serveur d'ingestion RTMP YouTube
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings.streamUrl}
                  readOnly
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(settings.streamUrl, true)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
                  title="Copier l'URL RTMP"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Broadcast Options */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-400" />
              <span>Paramètres du Direct</span>
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Titre de la diffusion
              </label>
              <input
                type="text"
                placeholder="Ex : Live Spécial Studio, Session Multimédia..."
                value={broadcastTitleInput}
                onChange={(e) => setBroadcastTitleInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Visibilité YouTube
                </label>
                <select
                  value={settings.privacy}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacy: e.target.value as 'public' | 'unlisted' | 'private',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="public">Public (Visible par tous les internautes)</option>
                  <option value="unlisted">Non répertorié (Accessible par lien)</option>
                  <option value="private">Privé (Test avant diffusion publique)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Latence du flux
                </label>
                <select
                  value={settings.latencyMode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      latencyMode: e.target.value as 'ultra_low' | 'low' | 'normal',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ultra_low">Ultra-faible latence (1 à 2 secondes)</option>
                  <option value="low">Faible latence (3 à 5 secondes)</option>
                  <option value="normal">Normale (Haute fidélité / Tampon 15s)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Qualité d'encodage
                </label>
                <select
                  value={settings.qualityPreset}
                  onChange={(e) => {
                    const preset = e.target.value as any;
                    let b = 6500;
                    if (preset === '720p60') b = 4500;
                    if (preset === '1080p30') b = 5000;
                    if (preset === '4k') b = 14000;
                    setSettings({ ...settings, qualityPreset: preset, targetBitrate: b });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="1080p60">1080p 60 FPS (Recommandé • 6 500 kbps)</option>
                  <option value="720p60">720p 60 FPS (Connexion modeste • 4 500 kbps)</option>
                  <option value="1080p30">1080p 30 FPS (5 000 kbps)</option>
                  <option value="4k">4K UHD 60 FPS (14 000 kbps)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Débit binaire cible (kbps)
                </label>
                <input
                  type="number"
                  min="2000"
                  max="20000"
                  step="500"
                  value={settings.targetBitrate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      targetBitrate: parseInt(e.target.value) || 6500,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Annuler
          </button>

          <button
            onClick={handleSaveConnection}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg shadow-md transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Connecter & Sauvegarder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
