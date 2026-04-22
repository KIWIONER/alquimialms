import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
    messages: [],
    loading: false,
    isTestActive: false,
    activeTestContent: '',
    isOpen: false,
    highlights: [],
    
    // Acciones
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),
    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    setHighlights: (texts) => set({ highlights: texts }),
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
        const { addMessage, setLoading, isTestActive, setTestActive, activeTestContent, setActiveTestContent, setHighlights } = get();
        
        // Limpiamos resaltados previos al iniciar nueva consulta
        setHighlights([]);

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

        // 2. Preparamos el input para la IA (VERACIDAD EXTREMA Y REFERENCIAS)
        let aiInput = text;
        const currentContext = { ...context };

        const systemRules = `
[REGLAS DE ORO DEL CEREBRO ALQUIMIA]:
1. VERACIDAD ABSOLUTA: No inventes datos. Cíñete ÚNICAMENTE al contenido de las tarjetas. Si algo no está, di "No consta en el temario".
2. IDIOMA: Responde SIEMPRE en ESPAÑOL.
3. TRAZABILIDAD TOTAL (SUBRAYADO): Es CRÍTICO que el alumno vea subrayado TODO lo que has usado para responder.
   - Identifica TODAS las frases literales (largas y exactas) de las tarjetas en las que te has basado. 
   - No te limites a 2 frases; si has usado 5 puntos clave, identifica las 5 frases originales.
   - AL FINAL de tu respuesta, añade los fragmentos con este formato: [[REFS: frase literal 1 | frase literal 2 | frase literal 3 | ...]]
   - RECUERDA: La frase debe ser EXACTA a como aparece en el texto original para que el sistema pueda encontrarla y subrayarla en amarillo.
`;

        if (isTestActive) {
            const contentToUse = context.blockContent || activeTestContent;
            currentContext.current_slug = "test-isolated-context";
            currentContext.current_carpeta = "isolated";

            aiInput += `\n\n${systemRules}\n\n[ESTÁS EN MODO TEST]:
- ÚNICO contenido válido: "${contentToUse}". 
- Envía 1 pregunta con 4 opciones. 
- Tras la pregunta 5, usa [[COMPLETADO]].`;
        } else {
            aiInput += `\n\n${systemRules}`;
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

            // 3. Procesar Referencias para el resaltado amarillo
            const refsMatch = aiText.match(/\[\[REFS:\s*(.*?)\s*\]\]/i);
            if (refsMatch) {
                const phrases = refsMatch[1].split('|').map(p => p.trim()).filter(p => p.length > 5);
                setHighlights(phrases);
                // Limpiamos el tag del texto final para que el usuario no vea el código
                aiText = aiText.replace(/\[\[REFS:.*?\]\]/gi, '').trim();
            }

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
