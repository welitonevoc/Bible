
import React from 'react';

interface AudioPlayerSettingsProps {
  title: string;
  description: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  onClose: () => void;
  // Simulação de progresso para o UI
  progress: number; 
}

const AudioPlayerSettings: React.FC<AudioPlayerSettingsProps> = ({
  title,
  description,
  isPlaying,
  onPlayPause,
  playbackRate,
  setPlaybackRate,
  onClose,
  progress
}) => {
  return (
    <div className="absolute top-full right-0 mt-4 w-80 bg-[#1c1c1e] border border-zinc-800 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center">Áudio</h3>
      </div>
      
      <div className="p-8 space-y-8 text-center">
        <div className="space-y-4">
          <h4 className="text-lg font-serif font-black text-blue-400 leading-tight">
            {title}
          </h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-medium line-clamp-4">
            {description}
          </p>
        </div>

        {/* Controles Principais */}
        <div className="flex items-center justify-center gap-8">
          <button className="text-zinc-500 hover:text-zinc-100 transition-colors relative group">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">30s</span>
          </button>

          <button 
            onClick={onPlayPause}
            className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 hover:scale-105 transition-all shadow-xl"
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button className="text-zinc-500 hover:text-zinc-100 transition-colors relative group">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
            </svg>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">30s</span>
          </button>
        </div>

        {/* Barra de Progresso Simples */}
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-zinc-700 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Seletor de Velocidade */}
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          {[0.75, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${
                playbackRate === rate ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={onClose}
        className="w-full py-5 bg-zinc-900 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-zinc-400 border-t border-zinc-800 transition-colors"
      >
        Sair do Modo Áudio
      </button>
    </div>
  );
};

export default AudioPlayerSettings;
