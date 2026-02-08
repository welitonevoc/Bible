
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Assistant from './components/Assistant';
import NotesArea from './components/NotesArea';
import ReaderSettings from './components/ReaderSettings';
import AudioPlayerSettings from './components/AudioPlayerSettings';
import GridSelector from './components/GridSelector';
import { MOCK_LESSONS } from './data/mockLessons';
import { ARC_GENESIS } from './data/defaultBible';
import { Lesson, LessonStatus, MySwordModule, BibleVerse, AIKey, MySwordModuleType, BibleReference, FavoriteVerse } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { scrapeLessonsFromUrl, generateLessonAudio } from './services/geminiService';
import { loadMySwordFile, getVerses, getChapterCount, getVerseCount, getVerseReferences, BIBLE_BOOKS, initSQLite } from './services/mySwordService';
import { saveModuleFile, getAllSavedModules, deleteSavedModule } from './services/storageService';

const INITIAL_AI_KEYS: AIKey[] = [
  { provider: 'Gemini', key: '', label: 'Gemini (Google)', model: 'gemini-3-flash-preview', status: 'untested', color: 'blue', badge: 'GRÁTIS • 60 req/min' },
];

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const App: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('bible_study_lessons');
    return saved ? JSON.parse(saved) : MOCK_LESSONS;
  });
  
  const [currentView, setCurrentView] = useState('LESSONS');
  const [isSplitView, setIsSplitView] = useState(false);
  const [selectedDecade, setSelectedDecade] = useState(2020);
  
  // Settings
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('serif');
  const [showNumbers, setShowNumbers] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Bible Context
  const [bibleSelection, setBibleSelection] = useState<BibleReference & { translationId: string }>({ 
    translationId: 'arc-default', 
    bookName: 'Gênesis', 
    chapter: 1, 
    verse: 1 
  });
  
  // History & Favorites
  const [history, setHistory] = useState<BibleReference[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => {
    const saved = localStorage.getItem('bible_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Selectors
  const [isBookSelectorOpen, setIsBookSelectorOpen] = useState(false);
  const [isChapterSelectorOpen, setIsChapterSelectorOpen] = useState(false);
  const [isVerseSelectorOpen, setIsVerseSelectorOpen] = useState(false);
  const [isBibleModuleSelectorOpen, setIsBibleModuleSelectorOpen] = useState(false);
  const [isCommentaryModuleSelectorOpen, setIsCommentaryModuleSelectorOpen] = useState(false);

  // Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [activeSettingsTab, setActiveSettingsTab] = useState<'MODULES' | 'API'>('API');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [viewingQuarterKey, setViewingQuarterKey] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [directUrlInput, setDirectUrlInput] = useState('');
  
  const [apiKeys, setApiKeys] = useState<AIKey[]>(() => {
    const saved = localStorage.getItem('bible_study_ai_keys');
    return saved ? JSON.parse(saved) : INITIAL_AI_KEYS;
  });

  const [modules, setModules] = useState<MySwordModule[]>([]);
  const [commentarySelection, setCommentarySelection] = useState({ moduleId: '' });
  const [bibleVerses, setBibleVerses] = useState<BibleVerse[]>([]);
  const [commentaryText, setCommentaryText] = useState<string>('');
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);
  const [availableVerses, setAvailableVerses] = useState<number[]>([]);

  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fullLibrary = useMemo(() => {
    const lib: Record<string, { year: number; quarter: number; theme: string; lessons: Lesson[] }> = {};
    lessons.forEach(lesson => {
      const key = `${lesson.year}-Q${lesson.quarter}`;
      if (!lib[key]) {
        lib[key] = {
          year: lesson.year,
          quarter: lesson.quarter,
          theme: lesson.theme,
          lessons: []
        };
      }
      lib[key].lessons.push(lesson);
    });
    return lib;
  }, [lessons]);

  const filteredQuarters = useMemo(() => {
    return Object.entries(fullLibrary).sort((a, b) => b[0].localeCompare(a[0]));
  }, [fullLibrary]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { db, type, name } = await loadMySwordFile(file);
      const id = `${type}-${name}-${Date.now()}`;
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await saveModuleFile(id, name, type, uint8Array);
      
      const newMod = { id, name, type, db };
      setModules(prev => [...prev, newMod]);
      if (type === 'cmt') setCommentarySelection({ moduleId: id });
      alert('Módulo importado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao importar módulo.');
    }
  };

  const theme = {
    bg: 'bg-[#09090b]',
    card: 'bg-[#18181b]',
    border: 'border-zinc-800',
    text: 'text-zinc-100',
    subtext: 'text-zinc-400',
    accent: 'text-amber-500'
  };

  useEffect(() => {
    localStorage.setItem('bible_study_lessons', JSON.stringify(lessons));
    localStorage.setItem('bible_study_ai_keys', JSON.stringify(apiKeys));
    localStorage.setItem('bible_favorites', JSON.stringify(favorites));
  }, [lessons, apiKeys, favorites]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const SQL = await initSQLite();
        const saved = await getAllSavedModules();
        const loadedModules: MySwordModule[] = saved.map(m => ({
          id: m.id, name: m.name, type: m.type, db: new SQL.Database(m.data)
        }));
        setModules(loadedModules);
        const firstCmt = loadedModules.find(m => m.type === 'cmt');
        if (firstCmt) setCommentarySelection({ moduleId: firstCmt.id });
      } catch (err) { console.error(err); }
    };
    bootstrap();
  }, []);

  const updateBibleSelection = (newRef: Partial<BibleReference & { translationId: string }>, skipHistory = false) => {
    setBibleSelection(prev => {
      const updated = { ...prev, ...newRef };
      if (!skipHistory && (updated.bookName !== prev.bookName || updated.chapter !== prev.chapter)) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ bookName: updated.bookName, chapter: updated.chapter, verse: updated.verse });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      return updated;
    });
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      updateBibleSelection(prev, true);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      updateBibleSelection(next, true);
    }
  };

  const toggleFavorite = (verse: BibleVerse) => {
    const refStr = `${bibleSelection.bookName} ${bibleSelection.chapter}:${verse.number}`;
    const isFav = favorites.find(f => f.reference === refStr);
    if (isFav) {
      setFavorites(favorites.filter(f => f.reference !== refStr));
    } else {
      setFavorites([...favorites, {
        id: Math.random().toString(36).substr(2, 9),
        reference: refStr,
        text: verse.text,
        translation: modules.find(m => m.id === bibleSelection.translationId)?.name || 'ARC',
        timestamp: Date.now()
      }]);
    }
  };

  useEffect(() => {
    const activeBible = modules.find(m => m.id === bibleSelection.translationId && m.type === 'bbl');
    const bookId = BIBLE_BOOKS[bibleSelection.bookName] || 1;
    
    if (activeBible) {
      const chapters = getChapterCount(activeBible.db, bookId);
      const verses = getVerseCount(activeBible.db, bookId, bibleSelection.chapter);
      setAvailableChapters(Array.from({ length: chapters }, (_, i) => i + 1));
      setAvailableVerses(Array.from({ length: verses }, (_, i) => i + 1));
      setBibleVerses(getVerses(activeBible.db, bookId, bibleSelection.chapter));
    } else if (bibleSelection.translationId === 'arc-default') {
      setAvailableChapters([1, 2]);
      const count = ARC_GENESIS[bibleSelection.chapter]?.length || 0;
      setAvailableVerses(Array.from({ length: count }, (_, i) => i + 1));
      setBibleVerses(ARC_GENESIS[bibleSelection.chapter] || []);
    }

    const activeCmt = modules.find(m => m.id === commentarySelection.moduleId && m.type === 'cmt');
    if (activeCmt) {
      const text = getVerseReferences(activeCmt.db, bookId, bibleSelection.chapter, bibleSelection.verse);
      setCommentaryText(text || 'Nenhum comentário detalhado disponível neste módulo para este versículo.');
    } else {
      setCommentaryText('');
    }
  }, [bibleSelection, modules, commentarySelection.moduleId]);

  useEffect(() => {
    if (bibleSelection.verse > 1) {
      setTimeout(() => {
        const target = verseRefs.current[bibleSelection.verse];
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('bg-amber-500/10', 'ring-1', 'ring-amber-500/30');
          setTimeout(() => target.classList.remove('bg-amber-500/10', 'ring-1', 'ring-amber-500/30'), 3000);
        }
      }, 300);
    }
  }, [bibleSelection.verse, bibleVerses]);

  const handlePlayAudio = async (text: string) => {
    if (isPlayingAudio) {
      if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; }
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    try {
      const base64 = await generateLessonAudio(text);
      if (base64) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioContext;
        const bytes = decodeBase64(base64);
        const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = playbackRate;
        source.connect(audioContext.destination);
        source.onended = () => { setIsPlayingAudio(false); audioSourceRef.current = null; };
        audioSourceRef.current = source;
        source.start(0);
      }
    } catch (err) { setIsPlayingAudio(false); }
  };

  const renderBibleContent = (fullWidth = true) => (
    <div className={`flex flex-col h-full bg-zinc-950/20 rounded-[56px] border border-zinc-800/50 overflow-hidden`}>
       <div className="max-w-4xl mx-auto px-10 py-24 w-full">
        <h2 className={`text-6xl font-serif font-black mb-20 text-center ${theme.accent} tracking-tighter`}>{bibleSelection.bookName} {bibleSelection.chapter}</h2>
        <div style={{ fontSize: `${fontSize}px` }} className={`space-y-4 leading-relaxed text-justify ${theme.text} ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
          {bibleVerses.map(v => (
            <div 
              key={v.number} 
              ref={el => { verseRefs.current[v.number] = el; }} 
              className={`relative pl-14 group transition-all duration-700 rounded-2xl p-4 -ml-4 cursor-pointer hover:bg-zinc-800/30 ${bibleSelection.verse === v.number ? 'bg-amber-500/5 border border-amber-500/20' : ''}`}
              onClick={() => updateBibleSelection({ verse: v.number })}
            >
              {showNumbers && <span className="absolute left-4 top-5 text-[11px] font-black text-zinc-700 group-hover:text-amber-500 transition-colors">{v.number}</span>}
              {(showNumbers && v.title) && <span className="block font-sans text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-amber-500/80">{v.title}</span>}
              <p className="opacity-90 group-hover:opacity-100 transition-opacity">{v.text}</p>
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(v); }}
                  className={`p-2 rounded-full border transition-all ${favorites.find(f => f.reference === `${bibleSelection.bookName} ${bibleSelection.chapter}:${v.number}`) ? 'bg-amber-500 text-zinc-950 border-amber-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-amber-500'}`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCommentaryContent = () => {
    const activeCmt = modules.find(m => m.id === commentarySelection.moduleId && m.type === 'cmt');
    return (
      <div className="flex flex-col h-full bg-zinc-900/40 rounded-[56px] border border-zinc-800/50 p-12 overflow-y-auto custom-scrollbar shadow-inner">
         <div className="flex items-center justify-between mb-12">
            <div className="relative">
              <button onClick={() => setIsCommentaryModuleSelectorOpen(!isCommentaryModuleSelectorOpen)} className="px-5 py-3 bg-zinc-800 border border-zinc-700 rounded-2xl text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white transition-all flex items-center gap-3">
                <span className="text-amber-500">🖊️</span> {activeCmt?.name || 'Selecione um Comentário'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {isCommentaryModuleSelectorOpen && (
                <GridSelector title="Selecionar Comentário" items={modules.filter(m => m.type === 'cmt').map(m => m.name)} selectedItem={activeCmt?.name || ''} onSelect={(val) => { const mod = modules.find(m => m.name === val); setCommentarySelection({ moduleId: mod ? mod.id : '' }); setIsCommentaryModuleSelectorOpen(false); }} onClose={() => setIsCommentaryModuleSelectorOpen(false)} columns={1} />
              )}
            </div>
         </div>
         
         {!activeCmt ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 space-y-6 text-center py-20">
              <div className="w-20 h-20 border-4 border-dashed border-zinc-700 rounded-full flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
              <p className="text-sm font-black uppercase tracking-widest max-w-[200px]">Nenhum módulo de comentário instalado ou selecionado.</p>
              <button onClick={() => {setCurrentView('SETTINGS'); setActiveSettingsTab('MODULES')}} className="text-[10px] font-black text-blue-500 hover:underline">Ir para Ajustes →</button>
            </div>
         ) : (
           <>
             <h2 className="text-4xl font-serif font-black text-zinc-100 mb-8 tracking-tighter">Comentário {bibleSelection.bookName} {bibleSelection.chapter}:{bibleSelection.verse}</h2>
             <div className="prose prose-invert prose-lg max-w-none text-zinc-400 leading-relaxed font-serif space-y-6">
                <div dangerouslySetInnerHTML={{ __html: commentaryText.replace(/\n/g, '<br/>') }} />
             </div>
             <div className="mt-20 p-8 bg-blue-600/5 border border-blue-600/20 rounded-[40px] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">✨</div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400">Teólogo Digital</h4>
                </div>
                <p className="text-sm italic opacity-70">Insights baseados no contexto do versículo e do comentário selecionado.</p>
                <button onClick={() => setCurrentView('ASSISTANT')} className="text-[10px] font-black uppercase text-blue-500 hover:underline tracking-widest">Aprofundar Estudo →</button>
             </div>
           </>
         )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${theme.bg}`}>
        <Navbar activeView={currentView} onNavigate={setCurrentView} />
        <main className="flex-grow max-w-7xl mx-auto px-4 lg:px-8 py-16 w-full flex flex-col pb-24">
          {currentView === 'BIBLE' ? (
            <div className="animate-in fade-in duration-500 h-full flex flex-col">
              <header className={`sticky top-20 z-[90] py-4 border-b backdrop-blur-xl px-8 flex flex-wrap gap-4 items-center justify-between ${theme.card} ${theme.border}`}>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex gap-1 mr-2 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                    <button onClick={goBack} disabled={historyIndex <= 0} className={`p-2 rounded-lg transition-all ${historyIndex > 0 ? 'text-zinc-100 hover:bg-zinc-800' : 'text-zinc-700'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
                    <button onClick={goForward} disabled={historyIndex >= history.length - 1} className={`p-2 rounded-lg transition-all ${historyIndex < history.length - 1 ? 'text-zinc-100 hover:bg-zinc-800' : 'text-zinc-700'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                  <button onClick={() => setIsBibleModuleSelectorOpen(!isBibleModuleSelectorOpen)} className={`px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-zinc-800 ${isBibleModuleSelectorOpen ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'text-zinc-500 hover:text-white bg-zinc-900/50'}`}>
                    {modules.find(m => m.id === bibleSelection.translationId)?.name || 'ARC'}
                  </button>
                  {isBibleModuleSelectorOpen && <GridSelector title="Versão" items={['ARC (Padrão)', ...modules.filter(m => m.type === 'bbl').map(m => m.name)]} selectedItem={modules.find(m => m.id === bibleSelection.translationId)?.name || 'ARC (Padrão)'} onSelect={(val) => { const mod = modules.find(m => m.name === val); updateBibleSelection({ translationId: mod ? mod.id : 'arc-default', chapter: 1, verse: 1 }); setIsBibleModuleSelectorOpen(false); }} onClose={() => setIsBibleModuleSelectorOpen(false)} columns={1} />}
                  <div className="w-px h-6 bg-zinc-800"></div>
                  <button onClick={() => setIsBookSelectorOpen(true)} className="px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest text-zinc-400 hover:text-white bg-zinc-900/50 border border-zinc-800">{bibleSelection.bookName}</button>
                  {isBookSelectorOpen && <GridSelector title="Livro" items={Object.keys(BIBLE_BOOKS)} selectedItem={bibleSelection.bookName} onSelect={(val) => { updateBibleSelection({ bookName: val, chapter: 1, verse: 1 }); setIsBookSelectorOpen(false); setIsChapterSelectorOpen(true); }} onClose={() => setIsBookSelectorOpen(false)} columns={1} />}
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsSplitView(!isSplitView)} className={`p-3 rounded-2xl transition-all border ${isSplitView ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></button>
                  <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black transition-all ${isSettingsOpen ? 'bg-zinc-100 text-zinc-950 border-zinc-100' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>AA</button>
                  {isSettingsOpen && <ReaderSettings fontSize={fontSize} setFontSize={setFontSize} fontFamily={fontFamily} setFontFamily={setFontFamily} showFootnotes={true} setShowFootnotes={()=>{}} showNumbers={showNumbers} setShowNumbers={setShowNumbers} onClose={() => setIsSettingsOpen(false)} />}
                </div>
              </header>
              <div className={`flex-1 overflow-hidden p-8 flex gap-8 ${isSplitView ? 'flex-row' : 'flex-col'}`}>
                <div className={`h-full overflow-y-auto custom-scrollbar transition-all duration-500 ${isSplitView ? 'w-1/2' : 'w-full max-w-4xl mx-auto'}`}>{renderBibleContent(isSplitView)}</div>
                {isSplitView && <div className="w-1/2 h-full overflow-hidden animate-in slide-in-from-right duration-500">{renderCommentaryContent()}</div>}
              </div>
            </div>
          ) : currentView === 'COMMENTS' ? (
            <div className="animate-in fade-in duration-500 flex-1 flex flex-col h-full">{renderCommentaryContent()}</div>
          ) : currentView === 'ASSISTANT' ? (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto py-12 w-full h-full">
              <Assistant 
                lessonTitle={`${bibleSelection.bookName} ${bibleSelection.chapter}:${bibleSelection.verse}`} 
                lessonContent={`Versículo Selecionado: ${bibleVerses.find(v => v.number === bibleSelection.verse)?.text || ''}. Comentário do Módulo: ${commentaryText || 'Nenhum comentário extra disponível.'}`} 
              />
            </div>
          ) : currentView === 'SETTINGS' ? (
            <div className="animate-in fade-in duration-700 w-full">
               <div className="flex gap-12 border-b border-zinc-800/50 mb-16">{['API', 'MODULES'].map((tab) => (<button key={tab} onClick={() => setActiveSettingsTab(tab as any)} className={`pb-6 px-4 text-[11px] font-black uppercase tracking-[0.4em] transition-all ${activeSettingsTab === tab ? 'border-b-4 border-amber-500 text-amber-500' : 'opacity-30 text-zinc-100 hover:opacity-100'}`}>{tab === 'API' ? 'Gerenciar APIs IA' : 'Módulos MyBible'}</button>))}</div>
               {activeSettingsTab === 'API' ? (
                 <div className="max-w-3xl mx-auto p-12 rounded-[56px] bg-[#1c1c1e] border border-zinc-800 shadow-2xl">
                    <h2 className="text-xl font-black text-amber-500 uppercase tracking-tighter mb-10">Configurações de IA</h2>
                    <input type="password" placeholder="Chave Gemini..." value={apiKeys[0].key} onChange={(e) => setApiKeys([{...apiKeys[0], key: e.target.value}])} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-8 py-5 text-sm text-zinc-100" />
                 </div>
               ) : (
                 <div className="p-12 rounded-[56px] border border-zinc-800 bg-[#18181b]"><h3 className="text-3xl font-serif font-black mb-8">Importar Módulo MySword</h3><input type="file" accept=".mybible,.bbl,.cmt" onChange={handleFileUpload} className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-400 hover:file:bg-zinc-700" /></div>
               )}
            </div>
          ) : selectedLessonId ? (
            <div className="max-w-5xl mx-auto w-full"><button onClick={() => setSelectedLessonId(null)} className="mb-8 text-blue-500 font-black uppercase text-[11px] tracking-widest">← Voltar</button><h1 className="text-7xl font-serif font-black mb-12">{lessons.find(l=>l.id===selectedLessonId)?.title}</h1><article className="prose prose-invert prose-2xl max-w-none text-zinc-300 font-serif" dangerouslySetInnerHTML={{ __html: lessons.find(l=>l.id===selectedLessonId)?.content?.replace(/\n/g, '<br/>') || '' }}></article></div>
          ) : viewingQuarterKey && fullLibrary[viewingQuarterKey] ? (
            <div className="w-full">
              <button onClick={() => setViewingQuarterKey(null)} className="mb-8 text-blue-500 font-black uppercase text-[11px] tracking-widest">← Voltar à Estante</button>
              <h1 className="text-8xl font-serif font-black mb-20">{fullLibrary[viewingQuarterKey].theme}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">{fullLibrary[viewingQuarterKey].lessons.map((l, i) => (<div key={l.id} onClick={() => setSelectedLessonId(l.id)} className="p-10 rounded-[48px] border border-zinc-800 bg-[#18181b] cursor-pointer hover:border-amber-500 transition-all"><span className="text-4xl font-serif italic text-zinc-700 block mb-4">Lição {i+1}</span><h4 className="text-2xl font-black">{l.title}</h4></div>))}</div>
            </div>
          ) : (
            <div className="w-full">
              <h1 className="text-[10rem] font-serif font-black tracking-tighter mb-20">Estante</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-20">{filteredQuarters.map(([key, data]) => (<div key={key} onClick={() => setViewingQuarterKey(key)} className={`group cursor-pointer aspect-[2/3] bg-zinc-800 rounded-r-3xl shadow-2xl border-l-[14px] border-zinc-950 transition-all hover:scale-110 ${data.lessons.length === 0 ? 'opacity-20' : 'hover:border-amber-500'}`}><div className="p-10 h-full flex flex-col justify-center text-center"><h4 className="text-[11px] font-black text-zinc-600 mb-4 uppercase tracking-widest">{data.year}</h4><h3 className="text-sm font-serif font-black leading-tight uppercase group-hover:text-amber-500">{data.theme}</h3></div></div>))}</div>
            </div>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-[100] h-16 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 flex items-center justify-between px-8">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setHistoryIndex(Math.max(0, historyIndex - 1))}>
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7 7-7" /></svg>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-all">Histórico</span>
              </div>
              <div className="w-px h-4 bg-zinc-800"></div>
              <div className="flex items-center gap-2 group cursor-pointer">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-all">Favoritos ({favorites.length})</span>
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              </div>
           </div>
           <div className="flex items-center gap-8">
              <button onClick={() => updateBibleSelection({ verse: Math.max(1, bibleSelection.verse - 1) })} className="p-2 text-zinc-500 hover:text-amber-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-black text-zinc-100 uppercase tracking-[0.2em]">{bibleSelection.bookName} {bibleSelection.chapter}:{bibleSelection.verse}</span>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{modules.find(m => m.id === bibleSelection.translationId)?.name || 'ARC'}</span>
              </div>
              <button onClick={() => updateBibleSelection({ verse: Math.min(availableVerses.length, bibleSelection.verse + 1) })} className="p-2 text-zinc-500 hover:text-amber-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg></button>
           </div>
           <div className="flex items-center gap-6">
              <button className="p-2 text-zinc-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
              <button className="p-2 text-zinc-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></button>
           </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
