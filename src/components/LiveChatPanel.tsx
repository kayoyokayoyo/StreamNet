import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Pin,
  Shield,
  Clock,
  MoreVertical,
  CheckCircle,
  Filter,
} from 'lucide-react';
import { ChatMessage, YouTubeChannel } from '../types/stream';

interface LiveChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  channel: YouTubeChannel;
  isLive: boolean;
  onGoBack?: () => void;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({
  messages,
  onSendMessage,
  channel,
  isLive,
  onGoBack,
}) => {
  const [inputText, setInputText] = useState('');
  const [slowMode, setSlowMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const pinnedMessage = messages.find((m) => m.isPinned);

  return (
    <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-all hover:-translate-x-0.5 mr-1"
              title="Retourner à la régie"
            >
              <span>← Retour</span>
            </button>
          )}
          <MessageSquare className="w-5 h-5 text-rose-500" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Chat en Direct YouTube
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlowMode(!slowMode)}
            className={`px-2.5 py-1 text-[11px] rounded font-medium border transition-colors ${
              slowMode
                ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                : 'bg-slate-900 border-slate-750 text-slate-400 hover:text-slate-200'
            }`}
            title="Activer le mode ralenti pour les spectateurs"
          >
            Ralenti {slowMode ? 'ON (10s)' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Pinned Message */}
      {pinnedMessage && (
        <div className="mb-3 p-2.5 rounded-lg bg-slate-900/90 border-l-2 border-red-500 border-y border-r border-slate-800 flex items-start gap-2.5 text-xs">
          <Pin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-white mr-1.5">
              {pinnedMessage.author} (Épinglé) :
            </span>
            <span className="text-slate-300">{pinnedMessage.text}</span>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <MessageSquare className="w-8 h-8 mb-2 text-slate-600" />
            <span className="text-xs font-semibold text-slate-400">
              Aucun message pour le moment
            </span>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Les commentaires de vos spectateurs YouTube apparaîtront ici dès le démarrage de votre direct.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-start gap-2.5 p-1.5 rounded hover:bg-slate-900/50 transition-colors text-xs"
            >
              <img
                src={msg.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                alt={msg.author}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-slate-700 object-cover shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`font-semibold ${
                      msg.isChannelOwner
                        ? 'text-cyan-400'
                        : msg.isModerator
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {msg.author}
                  </span>

                  {msg.isChannelOwner && (
                    <span className="text-[9px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-1 py-0.2 rounded font-medium">
                      Chaîne
                    </span>
                  )}

                  {msg.isModerator && (
                    <span className="text-[9px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-1 py-0.2 rounded font-medium flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Modérateur
                    </span>
                  )}

                  <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                    {msg.timestamp}
                  </span>
                </div>
                <p className="text-slate-300 text-xs mt-0.5 break-words">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Host Quick Input */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={channel.name ? `Répondre en tant que ${channel.name}...` : 'Écrire un message dans le chat...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 transition-colors shrink-0"
            title="Envoyer le message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
