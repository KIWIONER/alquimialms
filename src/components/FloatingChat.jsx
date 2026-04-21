import React, { useState } from 'react';
import ChatSidebar from './ChatSidebar.jsx';
import { MessageSquare, X, Minus, Brain } from 'lucide-react';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-4 w-96 h-[50vh] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header del Chat Flotante */}
          <div className="h-14 px-6 bg-slate-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-medical-green-500 rounded-xl flex items-center justify-center text-white">
                <Brain size={16} />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Asistente <span className="text-medical-green-400 italic">IA</span></span>
            </div>
            <div className="flex gap-1">
                <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
                >
                <Minus size={18} />
                </button>
            </div>
          </div>

          {/* El componente de Chat original encapsulado */}
          <div className="flex-1 overflow-hidden">
            <ChatSidebar />
          </div>
        </div>
      )}

      {/* Botón de Acceso (Burbuja) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-3 p-4 rounded-full shadow-2xl transition-all active:scale-95 ${
          isOpen 
          ? 'bg-slate-900 text-white' 
          : 'bg-medical-green-600 text-white hover:bg-medical-green-700 hover:pr-8'
        }`}
      >
        <div className="relative">
             {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
             {!isOpen && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-medical-green-600 rounded-full animate-pulse"></div>}
        </div>
        {!isOpen && (
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-xs font-black uppercase tracking-widest whitespace-nowrap">
                ¿Dudas? Pregunta a la IA
            </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
