
import React from 'react';

interface ReaderSettingsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: 'sans' | 'serif';
  setFontFamily: (font: 'sans' | 'serif') => void;
  showFootnotes: boolean;
  setShowFootnotes: (show: boolean) => void;
  showNumbers: boolean;
  setShowNumbers: (show: boolean) => void;
  onClose: () => void;
}

const ReaderSettings: React.FC<ReaderSettingsProps> = ({
  fontSize, setFontSize,
  fontFamily, setFontFamily,
  showFootnotes, setShowFootnotes,
  showNumbers, setShowNumbers,
  onClose
}) => {
  return (
    <div className="absolute top-full right-0 mt-4 w-72 bg-[#1c1c1e] border border-zinc-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-zinc-900/50 px-6 py-3 border-b border-zinc-800">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Configurações do Leitor</h3>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Tamanho da Fonte */}
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          {[14, 18, 24].map((size, idx) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center ${
                fontSize === size ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span style={{ fontSize: `${12 + idx * 3}px` }} className="font-black">AA</span>
            </button>
          ))}
        </div>

        {/* Família da Fonte */}
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setFontFamily('sans')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
              fontFamily === 'sans' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Inter
          </button>
          <button
            onClick={() => setFontFamily('serif')}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-serif font-bold transition-all ${
              fontFamily === 'serif' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Source Serif
          </button>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2">
          <button 
            onClick={() => setShowFootnotes(!showFootnotes)}
            className="flex items-center gap-4 w-full group"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              showFootnotes ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-700'
            }`}>
              {showFootnotes && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`text-sm font-bold tracking-tight transition-colors ${showFootnotes ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'}`}>Notas de Rodapé</span>
          </button>

          <button 
            onClick={() => setShowNumbers(!showNumbers)}
            className="flex items-center gap-4 w-full group"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              showNumbers ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-700'
            }`}>
              {showNumbers && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={`text-sm font-bold tracking-tight transition-colors ${showNumbers ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'}`}>Números e Títulos</span>
          </button>
        </div>
      </div>

      <button 
        onClick={onClose}
        className="w-full py-4 bg-zinc-900 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-zinc-400 border-t border-zinc-800 transition-colors"
      >
        Fechar Ajustes
      </button>
    </div>
  );
};

export default ReaderSettings;
