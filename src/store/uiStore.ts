import { create } from 'zustand';

export const useUIStore = create((set) => ({
    isLeftSidebarOpen: true,
    toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
    setLeftSidebar: (isOpen) => set({ isLeftSidebarOpen: isOpen }),
}));
