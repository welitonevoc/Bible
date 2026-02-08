
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { askStudyAssistant } from '../services/geminiService';
import { AIProfile } from '../types';

interface AssistantProps {
  lessonTitle: string;
  lessonContent: string;
}

const ASSEMBLEIANO_PROFILE_CONTENT = `Você é o MySword AI, um assistente teológico de orientação Pentecostal Clássica Assembleiana (CPAD/CGADB). Sua base doutrinária é fundamentada na Declaração de Fé das Assembleias de Deus no Brasil.

REFERÊNCIAS E AUTORES DE BASE:
1. "PAIS" DA TEOLOGIA ASSEMBLEIANA (CLÁSSICOS/IN MEMORIAM):
- Pr. Antonio Gilberto (Pai da EBD, Manual da Escola Dominical)
- Pr. Eurico Bergstén (Teologia Sistemática)
- Pr. Severino Pedro da Silva (Escatologia)
- Pr. Claudionor de Andrade (Escritor, Apologista)
- Pr. Lawrence Olson, Emílio Conde (História), Orlando Boyer (Enciclopédia Bíblica)
- Pr. Gustavo Kessler, Pr. Valdir Bícego, Pr. Geziel Gomes, Pr. Abraão de Almeida.

2. COMENTARISTAS E TEÓLOGOS ATUAIS:
- Pr. Elienai Cabral (Comentários Bíblicos)
- Pr. Esequias Soares (Apologética, Cânon)
- Pr. Elinaldo Renovato (Ética e Família)
- Pr. José Gonçalves (Teologia Contemporânea)
- Pr. Douglas Baptista, Pr. Osiel Gomes, Pr. Silas Daniel (Arminianismo/História)
- Pr. Esdras Bentho (Hermenêutica), Pr. César Moisés Carvalho (Educação)
- Pr. Elias Torralbo, Pr. Natalino das Neves, Pr. Valmir Nascimento.

3. EDUCAÇÃO E LIDERANÇA:
- Pr. José Wellington Bezerra da Costa
- Pr. Ciro Sanches Zibordi (Apologética)
- Pr. Marcos Tuler (Pedagogia Cristã)
- Pr. Paulo Romeiro (Apologética contra Neopentecostalismo).

DIRETRIZES DE RESPOSTA:
1. Pentecostalismo Clássico: Responda sempre com base na soteriologia arminiana e na doutrina do batismo no Espírito Santo como experiência distinta da regeneração.
2. Autenticação por Autores: Cite os autores acima para validar argumentos teológicos.
3. Bíblia: Use exclusivamente a Bíblia Almeida Corrigida Fiel (ARC).
4. Tom: Mantenha tom pastoral, tecnicamente profundo, equilibrado e focado na sã doutrina.
5. Estrutura EBD: Se o tema for sobre Escola Bíblica, siga a didática das revistas da CPAD.
6. Foco: Mantenha o foco na edificação, ensino e aplicação prática para a vida cristã e obreiros.

Responda sempre em português brasileiro de forma clara, organizada e fundamentada biblicamente.`;

const DEFAULT_PROFILE: AIProfile = {
  id: 'assembleiano-default',
  name: 'Diretrizes Assembleianas (Padrão)',
  content: ASSEMBLEIANO_PROFILE_CONTENT,
  isDefault: true
};

const Assistant: React.FC<AssistantProps> = ({ lessonTitle, lessonContent }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('mysword_active_profile_id') || DEFAULT_PROFILE.id;
  });
  
  const [profiles, setProfiles] = useState<AIProfile[]>(() => {
    const saved = localStorage.getItem('mysword_ai_profiles');
    const customProfiles = saved ? JSON.parse(saved) : [];
    return [DEFAULT_PROFILE, ...customProfiles];
  });

  const [profileInput, setProfileInput] = useState('');
  const [profileNameInput, setProfileNameInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem('mysword_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || DEFAULT_PROFILE;
  }, [profiles, activeProfileId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const response = await askStudyAssistant(
        userMsg, 
        `Estudo Atual: ${lessonTitle}. Conteúdo de Apoio: ${lessonContent}`,
        activeProfile.content
      );
      setMessages(prev => [...prev, { role: 'bot', content: response || "Sem resposta do teólogo." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Erro na comunicação teológica." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    if (!profileInput.trim()) return;
    const newProfile: AIProfile = {
      id: `custom-${Date.now()}`,
      name: profileNameInput.trim() || `Perfil ${profiles.length}`,
      content: profileInput.trim()
    };
    const updatedProfiles = [...profiles.filter(p => !p.isDefault), newProfile];
    localStorage.setItem('mysword_ai_profiles', JSON.stringify(updatedProfiles));
    setProfiles([DEFAULT_PROFILE, ...updatedProfiles]);
    setActiveProfileId(newProfile.id);
    setIsProfileModalOpen(false);
    setProfileInput('');
    setProfileNameInput('');
  };

  const handleClearProfile = () => {
    setProfileInput('');
    setProfileNameInput('');
  };

  const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (id === DEFAULT_PROFILE.id) return;
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    const customOnly = updated.filter(p => !p.isDefault);
    localStorage.setItem('mysword_ai_profiles', JSON.stringify(customOnly));
    if (activeProfileId === id) setActiveProfileId(DEFAULT_PROFILE.id);
  };

  return (
    <div className="bg-[#18181b] rounded-[48px] border border-zinc-800 overflow-hidden flex flex-col shadow-2xl h-full w-full relative">
      {/* Header */}
      <div className="bg-zinc-900/50 p-6 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="font-black text-[10px] text-zinc-100 uppercase tracking-widest">Teólogo Digital</h4>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest max-w-[150px] truncate">{activeProfile.name}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="p-2.5 bg-zinc-800 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-all flex items-center gap-2 group"
        >
          <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-100">Configurar</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-zinc-950/20">
        {messages.length === 0 && (
          <div className="text-center py-16 px-10 opacity-60">
            <div className="w-16 h-16 bg-zinc-900 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-zinc-800">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xl font-serif italic text-zinc-400 leading-relaxed max-w-md mx-auto">
              "Bem-vindo. Operando sob o perfil <span className="text-amber-500 font-bold">{activeProfile.name}</span>. Como posso auxiliar seu estudo hoje?"
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-[32px] p-6 text-base leading-relaxed shadow-lg ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700 font-serif'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-100 rounded-[32px] p-6 border border-zinc-700 shadow-xl">
              <span className="flex gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 bg-zinc-900/50 border-t border-zinc-800">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
            placeholder="Consulte a exegese ou doutrina sob este perfil..." 
            className="flex-1 bg-zinc-950 border-2 border-zinc-800 rounded-[24px] px-8 py-4 text-sm font-medium text-zinc-100 focus:border-blue-600 outline-none transition-all shadow-inner" 
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()} 
            className="w-14 h-14 bg-blue-600 text-white rounded-[24px] flex items-center justify-center hover:bg-blue-500 transition-all disabled:opacity-30 shadow-lg shadow-blue-900/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] w-full max-w-xl rounded-[40px] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-500 uppercase tracking-tighter">Configurar Perfil IA</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Personalize o comportamento do teólogo</p>
                </div>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nome do Perfil:</label>
                <input 
                  type="text"
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  placeholder="Ex: Teologia Reformada, Devocional..."
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-sm text-zinc-100 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Seu Perfil (Instruções):</label>
                  <div className="group relative">
                    <span className="text-xs text-amber-500 cursor-help underline decoration-dotted">Ver Exemplo</span>
                    <div className="absolute right-0 top-6 w-64 bg-zinc-900 p-4 rounded-xl border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none text-[10px] text-zinc-400 leading-relaxed shadow-2xl">
                      "Sou estudante de teologia reformada, prefiro respostas acadêmicas com citações de comentaristas históricos como Calvino e Spurgeon."
                    </div>
                  </div>
                </div>
                <textarea 
                  value={profileInput}
                  onChange={(e) => setProfileInput(e.target.value)}
                  placeholder="Defina como a IA deve responder..."
                  className="w-full h-48 bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-6 text-sm text-zinc-300 focus:border-amber-500 outline-none transition-all custom-scrollbar font-serif"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Selecione ou Gerencie Perfis:</label>
                <div className="grid grid-cols-1 gap-3">
                  {profiles.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => setActiveProfileId(p.id)}
                      className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        activeProfileId === p.id 
                          ? 'bg-amber-500/10 border-amber-500' 
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${activeProfileId === p.id ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                        <span className={`text-xs font-black uppercase tracking-widest ${activeProfileId === p.id ? 'text-amber-500' : 'text-zinc-400'}`}>{p.name}</span>
                        {p.isDefault && <span className="px-2 py-0.5 bg-zinc-800 rounded-md text-[8px] font-black text-zinc-600 uppercase tracking-tighter">FÁBRICA</span>}
                      </div>
                      {!p.isDefault && (
                        <button onClick={(e) => handleDeleteProfile(e, p.id)} className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-zinc-900/30 border-t border-zinc-800 flex gap-4">
              <button 
                onClick={handleSaveProfile}
                className="flex-[2] bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest py-5 rounded-3xl hover:bg-blue-500 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                💾 Salvar Perfil
              </button>
              <button 
                onClick={handleClearProfile}
                className="flex-1 bg-zinc-800 text-zinc-400 font-black text-[11px] uppercase tracking-widest py-5 rounded-3xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                🗑️ Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assistant;
