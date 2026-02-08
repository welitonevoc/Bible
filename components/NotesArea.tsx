
import React, { useState, useEffect } from 'react';

interface NotesAreaProps {
  initialNotes: string;
  onSave: (notes: string) => void;
}

const NotesArea: React.FC<NotesAreaProps> = ({ initialNotes, onSave }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== initialNotes) {
        setSaving(true);
        onSave(notes);
        setTimeout(() => setSaving(false), 1000);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes, initialNotes, onSave]);

  return (
    <div className="bg-[#18181b] rounded-[48px] p-10 border border-zinc-800 shadow-2xl min-h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h4 className="font-serif font-black text-zinc-100 text-2xl flex items-center gap-4 italic tracking-tighter">
          <span className="text-amber-500 not-italic">✏️</span>
          Diário de Reflexão
        </h4>
        {saving && <span className="text-[10px] font-black text-amber-500 animate-pulse uppercase tracking-[0.3em]">Autosalvando...</span>}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Registre aqui suas conclusões teológicas, versículos que marcaram este estudo e suas dúvidas para a próxima aula..."
        className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-zinc-300 placeholder-zinc-700 leading-relaxed font-serif text-xl"
      />
      <div className="mt-8 pt-8 border-t border-zinc-800/50 flex gap-6">
        <button className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-amber-500 transition-colors">Markdown</button>
        <button className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-amber-500 transition-colors">Citar Versículo</button>
      </div>
    </div>
  );
};

export default NotesArea;
