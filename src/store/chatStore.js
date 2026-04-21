import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
    messages: [],
    loading: false,
    isTestActive: false,
    activeTestContent: '',
    isOpen: false,
    
    // Acciones
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),
    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setLoading: (isLoading) => set({ loading: isLoading }),

    setTestActive: (active) => set({ isTestActive: active }),
    setActiveTestContent: (content) => set({ activeTestContent: content }),
    
    // Inicialización proactiva que no sobreescribe mensajes existentes
    initChatIfNeeded: (initialMessage) => set((state) => {
        if (state.messages.length === 0) {
            return { messages: [initialMessage] };
        }
        return state;
    }),

    // Acción centralizada para enviar mensajes a n8n (Gemini)
    sendMessage: async (text, context = {}) => {
        const { addMessage, setLoading, isTestActive, setTestActive, activeTestContent, setActiveTestContent } = get();
        
        // Si el contexto indica que iniciamos un test, lo activamos y guardamos el contenido
        if (context.isTestRequest) {
            setTestActive(true);
            if (context.blockContent) {
                setActiveTestContent(context.blockContent);
            }
        }

        // 1. Añadimos el mensaje del usuario al estado (tal cual lo escribió)
        addMessage({ role: 'user', content: text });
        setLoading(true);

        // 2. Preparamos el input para la IA (AISLAMIENTO DURO Y ESPAÑOL OBLIGATORIO)
        let aiInput = text;
        const currentContext = { ...context };

        if (isTestActive) {
            const contentToUse = context.blockContent || activeTestContent;
            
            // BLIND SLUG: Para evitar que el RAG de n8n traiga otras tarjetas, 
            // enviamos un slug inexistente durante el test.
            currentContext.current_slug = "test-isolated-context";
            currentContext.current_carpeta = "isolated";

            aiInput += `\n\n[ORDEN DE SISTEMA CRÍTICA: 
- IDIOMA: Responde SIEMPRE en ESPAÑOL. ES OBLIGATORIO.
- FOCO: El ÚNICO conocimiento válido es este texto: "${contentToUse}". 
- NO uses información de otras tarjetas o temas. 
- Continúa con el test. Si terminaste la pregunta 5, pon [[COMPLETADO]].]`;
        } else {
            // Refuerzo de idioma general para CUALQUIER consulta
            aiInput += "\n\n[ORDEN DE SISTEMA CRÍTICA: Responde SIEMPRE en ESPAÑOL. ES OBLIGATORIO.]";
        }

        try {
            const webhookUrl = import.meta.env.PUBLIC_N8N_CEREBRO_URL;
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatInput: aiInput,
                    sessionId: 'estudiante-demo',
                    ...currentContext
                }),
            });

            if (!response.ok) throw new Error('Cerebro no responde');

            const data = await response.json();
            let aiText = data.output || data.response || data.text || "Lo siento, he tenido un problema procesando tu duda.";

            addMessage({ role: 'assistant', content: aiText });
        } catch (err) {
            console.error('AI Agent Error:', err);
            addMessage({ 
                role: 'assistant', 
                content: '⚠️ Lo siento, mi conexión con el servidor central de Alquimia se ha interrumpido.' 
            });
        } finally {
            setLoading(false);
        }
    }
}));
