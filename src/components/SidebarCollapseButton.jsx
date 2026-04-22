import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

const SidebarCollapseButton = ({ hideButton = false }) => {
    const { isLeftSidebarOpen, toggleLeftSidebar } = useUIStore();

    useEffect(() => {
        const sidebar = document.getElementById('primary-sidebar');
        if (sidebar) {
            if (isLeftSidebarOpen) {
                sidebar.style.width = '360px';
                sidebar.style.minWidth = '360px';
                sidebar.classList.remove('sidebar-collapsed');
            } else {
                sidebar.style.width = '64px';
                sidebar.style.minWidth = '64px';
                sidebar.classList.add('sidebar-collapsed');
            }
        }
    }, [isLeftSidebarOpen]);

    if (hideButton) return null;

    return (
        <button 
            onClick={toggleLeftSidebar}
            className={`absolute top-10 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-400 hover:text-medical-green-600 transition-all z-[100] hover:scale-110 ${isLeftSidebarOpen ? '-right-5' : 'left-3'}`}
            style={{ pointerEvents: 'auto' }}
            title={isLeftSidebarOpen ? "Colapsar Menú" : "Expandir Menú"}
        >
            {isLeftSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
    );
};

export default SidebarCollapseButton;
