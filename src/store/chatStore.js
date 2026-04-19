import { create } from 'zustand';

export const useChatStore = create((set) => ({
    messages: [],
    loading: false,
    
    // Acciones
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setLoading: (isLoading) => set({ loading: isLoading }),
    
    // Inicialización proactiva que no sobreescribe mensajes existentes
    initChatIfNeeded: (initialMessage) => set((state) => {
        if (state.messages.length === 0) {
            return { messages: [initialMessage] };
        }
        return state;
    })
}));
