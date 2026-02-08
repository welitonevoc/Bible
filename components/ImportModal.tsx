
import React, { useState } from 'react';
import { searchAndImportLessons, scrapeLessonsFromUrl } from '../services/geminiService';
import { Lesson, LessonStatus } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (lessons: Lesson[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [importMode, setImportMode] = useState<'AUTO' | 'URL'>('URL');
  const [year, setYear] = useState('2024');
  const [quarter, setQuarter] = useState('4º');
  const [directUrl, setDirectUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      let data;
      if (importMode === 'AUTO') {
        data = await searchAndImportLessons(year, quarter);
      } else {
        if (!directUrl.includes('estudantesdabiblia.com.br')) {
          throw new Error("Por favor, use um link válido do site Estudantes da Bíblia.");
        }
        data = await scrapeLessonsFromUrl(directUrl);
        // Atualiza ano e trimestre se a IA extraiu
        if (data.trimestreInfo) {
          setYear(data.trimestreInfo.year);
          setQuarter(`${data.trimestreInfo.quarter}º`);
        }
      }
      setResults(data.lessons);
      if (data.lessons.length === 0) {
        setError("Nenhuma lição encontrada para este período.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = () => {
    const formatted: Lesson[] = results.map((r, i) => ({
      id: `imported-${Date.now()}-${i}`,
      title: r.title || 'Lição sem Título',
      summary: r.summary || 'Resumo não disponível',
      commentator: r.commentator || 'Não informado',
      year: parseInt(year),
      quarter: parseInt(quarter.charAt(0)) as any,
      theme: r.theme || 'Teologia',
      studyDate: new Date().toISOString().split('T')[0],
      status: LessonStatus.TODO,
      content: r.content || r.summary || '',
      notes: ''
    }));
    onImport(formatted);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isMinimized ? 'pointer-events-none' : 'bg-slate-900/60 backdrop-blur-sm'}`}>
      <div className={`bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto transition-all ${isMinimized ? 'translate-y-[40vh] scale-90 opacity-90' : ''}`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-900">Biblioteca CPAD</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg></button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-6 space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setImportMode('URL')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${importMode === 'URL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >Link Direto</button>
              <button 
                onClick={() => setImportMode('AUTO')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${importMode === 'AUTO' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >Busca Automática</button>
            </div>

            {importMode === 'URL' ? (
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">URL do Estudantes da Bíblia</label>
                <input 
                  type="text" 
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="Cole o link do sumário aqui..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <p className="text-[10px] text-slate-400 italic">Ex: https://www.estudantesdabiblia.com.br/cpad_sumario_1993_3t.htm</p>
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ano</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Trimestre</label>
                  <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="1º">1º Trimestre</option><option value="2º">2º Trimestre</option><option value="3º">3º Trimestre</option><option value="4º">4º Trimestre</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              onClick={handleSearch}
              disabled={loading || (importMode === 'URL' && !directUrl)}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> Extraindo Biblioteca...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> Analisar Sumário</>}
            </button>

            {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">{error}</div>}

            {results.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                  <p className="text-[10px] text-green-700 font-bold">✓ Encontradas {results.length} lições de {year} - {quarter}!</p>
                </div>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((r, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-100">
                      <h4 className="font-bold text-slate-800 text-[11px]">{r.title}</h4>
                    </div>
                  ))}
                </div>
                <button onClick={confirmImport} className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200">Importar Trimestre Completo</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
