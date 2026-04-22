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
      <div className="flex-1 w-[400px] flex flex-col h-full bg-white">
        <ChatSidebar />
      </div>
    </aside>
  );
};

export default ChatDrawer;
