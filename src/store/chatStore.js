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
        const { addMessage, setLoading, isTestActive, setTestActive, activeTestContent, setActiveTestContent, setHighlights, openChat } = get();
        
        // Limpiamos resaltados previos al iniciar nueva consulta
        setHighlights([]);
        
        // Aseguramos que el chat esté abierto si mandamos algo
        openChat();

        // Si el contexto indica que iniciamos un test, lo activamos y guardamos el contenido
        if (context.isTestRequest) {
            setTestActive(true);
            if (context.blockContent) {
                setActiveTestContent(context.blockContent);
            }
        }

        // 1. Añadimos el mensaje del usuario al estado
        if (context.isHidden) {
            // Si es oculto (como el prompt del test), mandamos un aviso visual amigable
            addMessage({ role: 'system_info', content: 'Generando test de autoevaluación...' });
        } else {
            addMessage({ role: 'user', content: text });
        }
        
        setLoading(true);

        // 2. Preparamos el input para la IA (VERACIDAD EXTREMA Y REFERENCIAS)
        let aiInput = text;
        const currentContext = { ...context };

        const systemRules = `
[IDENTIDAD: CEREBRO - TUTOR DOCTORAL DE ALQUIMIA]
Eres "Cerebro", el tutor inteligente y experto de Alquimia LMS. Tu personalidad es culta, pedagógica y profundamente profesional. Tu lengua nativa es el gallego, lo que te otorga un matiz de sabiduría y cercanía, aunque respondes siempre con elegancia y precisión en el idioma que el alumno prefiera (predeterminado: Castellano).

[BASE DE CONOCIMIENTO Y HERRAMIENTAS]
- Tu ÚNICA fuente de verdad son las TARJETAS de la Unidad Didáctica (UD) actual.
- Estás conectado a la herramienta "obtener-documento-actual". Para usarla, debes pasar el valor del slug exacto que recibes: "${currentContext.current_slug}".
- El contenido de las tarjetas viene estructurado en Markdown. Cada encabezado "##" identifica el TÍTULO DE UNA TARJETA única.

[REGLAS DE ORO DE RESPUESTA]:
1. NAVEGACIÓN PRECISA: Si el alumno pregunta por un punto concreto (ej: "Sección 3.2"), busca el encabezado "## 3.2" en el texto recibido y explícalo basándote SOLO en ese bloque.
2. VERACIDAD ABSOLUTA: No inventes datos. No busques información externa ni menciones PDFs fuera de estas tarjetas. Si algo no consta, di: "No he localizado ese dato específico en los materiales de esta unidad".
3. TRACEABILIDAD ([[REFS]]): Es OBLIGATORIO. Identifica las frases LITERALES y LARGAS originales del texto. Tras tu respuesta, añade una línea final con este formato: [[REFS: frase literal 1 | frase literal 2 | ...]]
4. FORMATO: Usa EXCLUSIVAMENTE Markdown (**negrita**, *cursiva*, listas). PROHIBIDO usar etiquetas HTML (<ins>, <u>, etc).
5. ESTILO: Tono doctoral y empático. Máximo 3-4 párrafos por respuesta.
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

            // 3. Procesar Referencias para el resaltado amarillo (ULTRA-ROBUSTO)
            const refsMatch = aiText.match(/\[\[\s*REFS\s*:\s*([\s\S]*?)\s*\]\]/i);
            if (refsMatch) {
                const phrases = refsMatch[1]
                    .split(/[|\|]/)
                    .map(p => p.trim())
                    .filter(p => p.length > 5);
                
                if (phrases.length > 0) {
                    setHighlights(phrases);
                }
                // Limpiamos CUALQUIER variante del tag del texto final
                aiText = aiText.replace(/\[\[\s*REFS\s*:[\s\S]*?\]\]/gi, '').trim();
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
