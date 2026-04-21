import React from 'react';
import ChatSidebar from './ChatSidebar.jsx';
import { useChatStore } from '../store/chatStore';
import { X } from 'lucide-react';

const ChatDrawer = () => {
  const { isOpen, closeChat } = useChatStore();

  return (
    <aside 
      className={`h-full bg-white border-l border-slate-200 shadow-2xl transition-all duration-500 ease-in-out shrink-0 flex flex-col relative z-40 ${
        isOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 overflow-hidden pointer-events-none border-none'
      }`}
    >
      {/* Botón de cierre integrado */}
      <button 
        onClick={closeChat}
        className="absolute top-4 left-[-16px] w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all z-50 hover:scale-110"
        title="Cerrar Panel IA"
      >
        <X size={16} />
      </button>

      <div className="flex-1 w-[400px] flex flex-col h-full bg-white">
        <ChatSidebar />
      </div>
    </aside>
  );
};

export default ChatDrawer;
