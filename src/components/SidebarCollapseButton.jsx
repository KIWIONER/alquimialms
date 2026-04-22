import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const SidebarCollapseButton = () => {
    const { isLeftSidebarOpen, toggleLeftSidebar } = useUIStore();

    useEffect(() => {
        const sidebar = document.getElementById('primary-sidebar');
        if (sidebar) {
            if (isLeftSidebarOpen) {
                sidebar.style.width = '360px';
                sidebar.style.opacity = '1';
                sidebar.style.pointerEvents = 'auto';
            } else {
                sidebar.style.width = '0px';
                sidebar.style.opacity = '0';
                sidebar.style.pointerEvents = 'none';
            }
        }
    }, [isLeftSidebarOpen]);

    return (
        <button 
            onClick={toggleLeftSidebar}
            className="absolute -right-4 top-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-medical-green-600 transition-all z-50 hover:scale-110"
            title={isLeftSidebarOpen ? "Colapsar Menú" : "Expandir Menú"}
        >
            {isLeftSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
    );
};

export default SidebarCollapseButton;
