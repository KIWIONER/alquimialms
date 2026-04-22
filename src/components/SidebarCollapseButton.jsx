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
                sidebar.style.minWidth = '360px';
                sidebar.classList.remove('sidebar-collapsed');
            } else {
                sidebar.style.width = '12px';
                sidebar.style.minWidth = '12px';
                sidebar.classList.add('sidebar-collapsed');
            }
        }
    }, [isLeftSidebarOpen]);

    return (
        <button 
            onClick={toggleLeftSidebar}
            className={`absolute top-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-medical-green-600 transition-all z-[100] hover:scale-110 ${isLeftSidebarOpen ? '-right-4' : 'left-[-4px]'}`}
            style={{ pointerEvents: 'auto' }}
            title={isLeftSidebarOpen ? "Colapsar Menú" : "Expandir Menú"}
        >
            {isLeftSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
    );
};

export default SidebarCollapseButton;
