
import React from 'react';

interface GridSelectorProps {
  title: string;
  items: number[] | string[];
  selectedItem: number | string;
  onSelect: (item: any) => void;
  onClose: () => void;
  onBack?: () => void;
  columns?: number;
}

const GridSelector: React.FC<GridSelectorProps> = ({
  title,
  items,
  selectedItem,
  onSelect,
  onClose,
  onBack,
  columns = 5
}) => {
  const isList = columns === 1;

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }[columns as keyof typeof gridColsClass] || 'grid-cols-5';

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[360px] bg-white border border-zinc-300 rounded-xl shadow-2xl z-[120] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Cabeçalho do Seletor */}
      <div className="bg-[#f1f1f1] px-4 py-3 border-b border-zinc-300 flex items-center justify-between">
        <button 
          onClick={onBack || onClose} 
          className="p-1 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{title}</h3>
        
        <button 
          onClick={onClose}
          className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-tight transition-colors"
        >
          CANCELAR
        </button>
      </div>

      {/* Grade ou Lista de Itens */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar-light p-0">
        <div className={`grid ${gridColsClass} border-t border-l border-zinc-200`}>
          {items.map((item) => (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={`flex items-center justify-center text-sm font-semibold border-r border-b border-zinc-200 transition-all ${
                isList ? 'w-full py-4 px-6 justify-start text-left' : 'aspect-square'
              } ${
                selectedItem === item 
                  ? 'bg-amber-500 text-white shadow-inner' 
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 active:bg-zinc-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridSelector;
