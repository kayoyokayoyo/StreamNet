import React, { useRef, useState } from 'react';
import {
  Upload,
  Film,
  Music,
  Image as ImageIcon,
  Play,
  Trash2,
  Repeat,
  ArrowUp,
  ArrowDown,
  Plus,
  Radio,
  FileVideo,
  ListMusic,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { MediaItem, MediaType } from '../types/stream';

interface MediaManagerProps {
  mediaList: MediaItem[];
  currentMediaId: string | null;
  onSelectMedia: (media: MediaItem) => void;
  onAddMedia: (item: MediaItem) => void;
  onRemoveMedia: (id: string) => void;
  onReorderMedia: (currentIndex: number, direction: 'up' | 'down') => void;
  onToggleLoop: (id: string) => void;
  onChangeGain: (id: string, gain: number) => void;
  continuousLoop: boolean;
  setContinuousLoop: (loop: boolean) => void;
  autoPlayNext: boolean;
  setAutoPlayNext: (auto: boolean) => void;
  onGoToDashboard: () => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  mediaList,
  currentMediaId,
  onSelectMedia,
  onAddMedia,
  onRemoveMedia,
  onReorderMedia,
  onToggleLoop,
  onChangeGain,
  continuousLoop,
  setContinuousLoop,
  autoPlayNext,
  setAutoPlayNext,
  onGoToDashboard,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [lastImportedMedia, setLastImportedMedia] = useState<MediaItem | null>(null);

  // File Upload Handler
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      let type: MediaType = 'video';
      if (file.type.startsWith('audio/')) {
        type = 'audio';
      } else if (file.type.startsWith('image/')) {
        type = 'image';
      }

      const objectUrl = URL.createObjectURL(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

      if (type === 'video') {
        const tempVideo = document.createElement('video');
        tempVideo.src = objectUrl;
        tempVideo.onloadedmetadata = () => {
          const newItem: MediaItem = {
            id: `media-upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: 'video',
            url: objectUrl,
            duration: Math.round(tempVideo.duration) || 30,
            sizeFormatted: `${sizeMB} Mo`,
            isLooping: false,
            gain: 0.9,
            isUploaded: true,
          };
          onAddMedia(newItem);
          setLastImportedMedia(newItem);
        };
      } else if (type === 'audio') {
        const tempAudio = document.createElement('audio');
        tempAudio.src = objectUrl;
        tempAudio.onloadedmetadata = () => {
          const newItem: MediaItem = {
            id: `media-upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: 'audio',
            url: objectUrl,
            duration: Math.round(tempAudio.duration) || 60,
            sizeFormatted: `${sizeMB} Mo`,
            isLooping: false,
            gain: 0.85,
            isUploaded: true,
          };
          onAddMedia(newItem);
          setLastImportedMedia(newItem);
        };
      } else {
        const newItem: MediaItem = {
          id: `media-upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: 'image',
          url: objectUrl,
          duration: 15,
          sizeFormatted: `${sizeMB} Mo`,
          isLooping: true,
          gain: 1.0,
          isUploaded: true,
        };
        onAddMedia(newItem);
        setLastImportedMedia(newItem);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const filteredMedia = mediaList.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = Math.floor(sec % 60);
    return `${mins}:${remainingSec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col gap-5">
      {/* Top Action Bar with Quick Return to Dashboard */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all hover:-translate-x-1 shadow-md group"
            title="Retourner au Dashboard de régie"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>← Retour Dashboard</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Médiathèque & Playlist Régie
              </h2>
              <span className="text-xs font-mono text-slate-400">
                ({mediaList.length} média{mediaList.length > 1 ? 's' : ''})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Importez vos médias (vidéos, musiques) puis retournez au Dashboard pour démarrer la diffusion en direct.
            </p>
          </div>
        </div>

        {/* Big Dashboard Navigation Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 active:from-red-700 active:to-rose-700 rounded-xl shadow-lg shadow-red-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Retourner au Dashboard pour contrôler et lancer la diffusion"
          >
            <Radio className="w-4 h-4 animate-pulse shrink-0" />
            <span className="hidden sm:inline">Retourner au Dashboard & Lancer le Stream</span>
            <span className="sm:hidden">Dashboard & Lancer Direct</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Instant Notification Banner when a media file is imported */}
      {lastImportedMedia && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-red-950/40 border-2 border-emerald-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Média chargé avec succès : {lastImportedMedia.name}</span>
                <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  PRÊT POUR LE DIRECT
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Ce contenu multimédia est prêt à être diffusé. Cliquez sur le bouton ci-contre pour aller au Dashboard et lancer la diffusion sur YouTube.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onSelectMedia(lastImportedMedia);
              onGoToDashboard();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98] self-end sm:self-auto shrink-0 border border-red-400/30 cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse text-white shrink-0" />
            <span className="hidden sm:inline">Retourner au Dashboard & Lancer le Stream</span>
            <span className="sm:hidden">Dashboard & Lancer Direct</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Playlist Settings and Import Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={autoPlayNext}
              onChange={(e) => setAutoPlayNext(e.target.checked)}
              className="accent-cyan-400 rounded cursor-pointer"
            />
            <span className="whitespace-nowrap font-medium">Enchaînement auto</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={continuousLoop}
              onChange={(e) => setContinuousLoop(e.target.checked)}
              className="accent-cyan-400 rounded cursor-pointer"
            />
            <Repeat className="w-3.5 h-3.5 text-cyan-400" />
            <span className="whitespace-nowrap font-medium">Boucle 24/7</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg shadow-md transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Importer un fichier média</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,audio/*,image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
        }`}
      >
        <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shadow">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-200">
            Cliquez pour importer ou glissez-déposez vos fichiers médias ici
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Formats pris en charge : Vidéos (MP4, WebM, MOV), Audios (MP3, WAV, AAC), Mires visuelles (PNG, JPG)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tous ({mediaList.length})
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'video'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vidéos</span>
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'audio'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-rose-400" />
            <span>Audios</span>
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              filterType === 'image'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Mires & Images</span>
          </button>
        </div>

        {/* Search input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Rechercher un média..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/70"
          />
        </div>
      </div>

      {/* Media Items Table / List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredMedia.length === 0 ? (
          <div className="py-12 text-center border border-slate-800/80 rounded-xl bg-slate-950/30">
            <FileVideo className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Aucun fichier média dans votre médiathèque</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Glissez-déposez un fichier vidéo ou audio ci-dessus pour alimenter votre régie.
            </p>
          </div>
        ) : (
          filteredMedia.map((item, index) => {
            const isCurrentlyPlaying = item.id === currentMediaId;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                  isCurrentlyPlaying
                    ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                    : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700/80 hover:bg-slate-950'
                }`}
              >
                {/* Media Icon & Information */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      item.type === 'video'
                        ? 'bg-blue-950/60 border-blue-800 text-blue-400'
                        : item.type === 'audio'
                        ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                        : 'bg-amber-950/60 border-amber-800 text-amber-400'
                    }`}
                  >
                    {item.type === 'video' && <Film className="w-5 h-5" />}
                    {item.type === 'audio' && <Music className="w-5 h-5" />}
                    {item.type === 'image' && <ImageIcon className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate max-w-sm">
                        {item.name}
                      </span>
                      {isCurrentlyPlaying && (
                        <span className="shrink-0 text-[10px] font-bold text-cyan-400 uppercase bg-cyan-950 border border-cyan-800 px-1.5 py-0.2 rounded font-mono">
                          À L'ANTENNE
                        </span>
                      )}
                      {item.isUploaded && (
                        <span className="shrink-0 text-[10px] text-emerald-400 font-medium font-mono">
                          Fichier local
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="uppercase font-mono text-[10px]">{item.type}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{formatSeconds(item.duration)}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{item.sizeFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Gain & Loop Control */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                  {/* Loop toggle */}
                  <button
                    onClick={() => onToggleLoop(item.id)}
                    className={`p-1.5 rounded transition-colors ${
                      item.isLooping
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title={item.isLooping ? 'Boucle active pour ce clip' : 'Activer la boucle'}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>

                  {/* Volume gain slider */}
                  <div className="flex items-center gap-1.5" title="Gain audio du clip">
                    <span className="text-[10px] text-slate-500 font-mono">Gain</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={item.gain}
                      onChange={(e) => onChangeGain(item.id, parseFloat(e.target.value))}
                      className="w-14 h-1 bg-slate-800 accent-cyan-400 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Reorder Buttons */}
                  <button
                    onClick={() => onReorderMedia(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                    title="Monter"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onReorderMedia(index, 'down')}
                    disabled={index === mediaList.length - 1}
                    className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Play & Go to Dashboard */}
                  <button
                    onClick={() => {
                      onSelectMedia(item);
                      onGoToDashboard();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-md shadow-red-950/40 transition-all hover:scale-[1.02] whitespace-nowrap"
                    title="Sélectionner ce média et retourner au Dashboard pour diffuser"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>À l'antenne & Régie →</span>
                  </button>

                  {/* Delete Item */}
                  <button
                    onClick={() => onRemoveMedia(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                    title="Supprimer du conducteur"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticky Ready Bar */}
      {mediaList.length > 0 && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Tv className="w-4 h-4 text-cyan-400" />
            <span>
              Conducteur prêt avec <strong>{mediaList.length} média{mediaList.length > 1 ? 's' : ''}</strong> configuré{mediaList.length > 1 ? 's' : ''}.
            </span>
          </div>

          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-2 px-5 py-2 font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-lg shadow-md transition-all hover:scale-[1.02] whitespace-nowrap"
          >
            <Radio className="w-4 h-4" />
            <span>Retourner au Dashboard pour Lancer la Diffusion →</span>
          </button>
        </div>
      )}
    </div>
  );
};
