import React from 'react';
import { Brain } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

const AIStudyButton = () => {
  const { toggleChat, isOpen } = useChatStore();

  return (
    <button 
      onClick={toggleChat}
      className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-xl active:scale-95 group border-none ${
        isOpen 
          ? "bg-medical-green-600 text-white shadow-medical-green-600/30 scale-[1.02]" 
          : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20"
      }`}
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-medical-green-500' : 'bg-slate-800 group-hover:bg-medical-green-500'}`}>
        <Brain size={16} className={isOpen ? 'animate-pulse' : ''} />
      </div>
      {isOpen ? 'Cerrar Agente' : 'Estudia con IA'}
    </button>
  );
};

export default AIStudyButton;
