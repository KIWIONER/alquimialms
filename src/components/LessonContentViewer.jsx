import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../store/chatStore';
import { Brain, CheckCircle, ChevronRight } from 'lucide-react';

/**
 * LESSON CONTENT VIEWER (Student Side)
 * Renders document content as interactive cards with a collapsible section index.
 * Content is fetched from the 'tarjetas' table using the document ID.
 */
const LessonContentViewer = ({ docId, unitName, moduleName }) => {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [completedCardIds, setCompletedCardIds] = useState(new Set());
    const [activeTestingCardId, setActiveTestingCardId] = useState(null);
    const { messages, sendMessage, setTestActive } = useChatStore();
    const cardRefs = useRef({});

    useEffect(() => {
        if (docId) {
            fetchTarjetas();
        }
    }, [docId]);

    // Listener para detectar cuando el test termina vía tag oculto de la IA
    useEffect(() => {
        if (activeTestingCardId && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant' && lastMsg.content.includes('[[COMPLETADO]]')) {
                setCompletedCardIds(prev => new Set([...prev, activeTestingCardId]));
                setActiveTestingCardId(null);
                setTestActive(false);
            }
        }
    }, [messages, activeTestingCardId]);

    const fetchTarjetas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .schema('nutricionista')
                .from('tarjetas')
                .select('*')
                .eq('documento_id', docId)
                .order('orden', { ascending: true });
            
            if (error) throw error;
            setBlocks(data || []);
        } catch (err) {
            console.error('Error fetching tarjetas:', err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBlock = (id) => {
        if (cardRefs.current[id]) {
            cardRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight effect
            const el = cardRefs.current[id];
            el.classList.add('ring-2', 'ring-medical-green-500', 'ring-offset-4');
            setTimeout(() => el.classList.remove('ring-2', 'ring-medical-green-500', 'ring-offset-4'), 2000);
        }
    };

    const handleTestClick = async (block) => {
        // Marcamos como "En Progreso"
        setActiveTestingCardId(block.id);
        
        // Enviamos el mensaje al chat con instrucciones precisas: 5 preguntas, FOCO ESTRICTO e IDIOMA ESPAÑOL
        const prompt = `Por favor, genérame un mini-test interactivo de exactamente 5 preguntas técnicas sobre el contenido de esta sección titulada "${block.titulo}". 

REGLAS CRÍTICAS DE FOCO E IDIOMA:
1. HABLA SIEMPRE EN ESPAÑOL. Aunque el texto de la tarjeta esté en otro idioma, tus preguntas y feedback deben ser en castellano.
2. BÁSTATE ÚNICAMENTE en el texto de abajo. No cites otras unidades, tarjetas o conocimiento general externo.
3. Envía las preguntas de UNA EN UNA.
4. Cada pregunta DEBE tener exactamente 4 opciones de respuesta (a, b, c, d).
5. FORMATO OBLIGATORIO:
   Pregunta X/5: [Pregunta]
   a) [Opción]
   b) [Opción]
   c) [Opción]
   d) [Opción]
6. TRAS MI RESPUESTA: Dame feedback (si acerté o no y por qué) y **acto seguido envía la SIGUIENTE PREGUNTA**.
7. ¡FINALIZACIÓN!: Justo después del feedback de la pregunta 5, escribe exactamente el tag [[COMPLETADO]] para cerrar el test.

Contenido exclusivo de esta tarjeta:
${block.contenido}

Recuerda: NO TE SALGAS DE ESTE TEXTO Y RESPONDE SIEMPRE EN ESPAÑOL.`;
        
        // Enviamos el mensaje
        await sendMessage(prompt, {
            current_slug: unitName,
            isTestRequest: true,
            blockContent: block.contenido
        });
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-white">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-medical-green-100 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-medical-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Lección...</span>
            </div>
        </div>
    );

    if (blocks.length === 0) return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-5 text-center bg-white">
            <h3 className="text-xl font-bold text-slate-600 border-none pb-0 mt-0">Contenido no disponible</h3>
            <p className="text-sm max-w-xs leading-relaxed">Aún no se han generado tarjetas para esta unidad.</p>
        </div>
    );

    return (
        <div className="flex h-full w-full bg-slate-100/30 overflow-hidden relative">
            
            {/* 1. Toggle Button for Sidebar (Floating) */}
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`absolute left-4 top-4 z-40 p-2.5 bg-white rounded-xl shadow-md border border-slate-200 text-slate-400 hover:text-medical-green-600 transition-all ${isSidebarOpen ? 'translate-x-[260px]' : 'translate-x-0'}`}
                title={isSidebarOpen ? "Cerrar índice" : "Abrir índice de temas"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
            </button>

            {/* 2. Section Navigation Sidebar */}
            <aside 
                className={`fixed md:relative z-30 h-full bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none flex flex-col ${isSidebarOpen ? 'w-[280px] opacity-100' : 'w-0 opacity-0 -translate-x-full md:translate-x-0'}`}
            >
                <div className="p-6 pt-20 border-b border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navegación</span>
                    <h2 className="text-sm font-bold text-slate-800 mt-1 line-clamp-2">{unitName}</h2>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {blocks.map((block, i) => (
                        <button 
                            key={block.id}
                            onClick={() => scrollToBlock(block.id)}
                            className="w-full text-left p-3 mb-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-medical-green-50 hover:text-medical-green-700 hover:border-medical-green-100 border border-transparent transition-all flex gap-3 group"
                        >
                            <span className="text-[10px] opacity-40 group-hover:opacity-100 mt-0.5">{i + 1}</span>
                            <span className="truncate">{block.titulo}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* 3. Main Card Area */}
            <main className="flex-1 overflow-y-auto pt-20 pb-20 custom-scrollbar">
                <div className="max-w-[850px] mx-auto px-4 md:px-8">
                    
                    {/* Lesson Header Card */}
                    <div className="mb-12 text-center">
                        <span className="text-[10px] font-black text-medical-green-600 bg-medical-green-50 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-medical-green-100">
                            {moduleName}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-4 tracking-tight">
                            {unitName}
                        </h1>
                        <div className="w-12 h-1 bg-medical-green-500 mx-auto mt-6 rounded-full opacity-40"></div>
                    </div>

                    {/* Content Cards */}
                    {blocks.map((block, index) => {
                        const isIndexCard = block.titulo.toLowerCase().includes('indice') || block.titulo.toLowerCase().includes('índice');
                        const isCompleted = completedCardIds.has(block.id);
                        const isTesting = activeTestingCardId === block.id;
                        
                        return (
                            <section 
                                key={block.id}
                                ref={el => cardRefs.current[block.id] = el}
                                className={`bg-white rounded-[2.5rem] border mb-10 overflow-hidden transition-all duration-500 shadow-xl group/card ${
                                    isCompleted 
                                        ? 'border-medical-green-400 bg-medical-green-50/20 shadow-medical-green-200/40 order-1' 
                                        : isTesting
                                            ? 'border-amber-400 bg-amber-50/10 shadow-amber-200/20 ring-2 ring-amber-500 ring-offset-2 animate-pulse-subtle'
                                            : 'border-slate-200 shadow-slate-200/40 hover:shadow-2xl hover:shadow-medical-green-200/20'
                                }`}
                            >
                                {/* Card Header */}
                                <div className={`px-8 md:px-12 py-6 border-b flex items-center justify-between gap-4 ${isCompleted ? 'bg-medical-green-100/50 border-medical-green-100' : isTesting ? 'bg-amber-100/50 border-amber-200' : 'bg-slate-50/30 border-slate-50'}`}>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs font-black w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all ${
                                            isCompleted 
                                                ? 'bg-medical-green-500 text-white border-medical-green-500' 
                                                : isTesting
                                                    ? 'bg-amber-500 text-white border-amber-500 animate-bounce'
                                                    : 'bg-white text-slate-300 border-slate-200 group-hover/card:text-medical-green-400 group-hover/card:border-medical-green-200'
                                        }`}>
                                            {isCompleted ? <CheckCircle size={14} /> : index + 1}
                                        </span>
                                        <h2 className={`text-xs font-bold uppercase tracking-widest ${isCompleted ? 'text-medical-green-800' : isTesting ? 'text-amber-800' : 'text-slate-500'}`}>
                                            {block.titulo}
                                        </h2>
                                    </div>

                                    {!isIndexCard && (
                                        <button 
                                            onClick={() => handleTestClick(block)}
                                            disabled={isCompleted || isTesting}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                isCompleted
                                                    ? 'bg-medical-green-200 text-medical-green-600 cursor-default px-6'
                                                    : isTesting
                                                        ? 'bg-amber-200 text-amber-700 cursor-default'
                                                        : 'bg-white border border-slate-200 text-slate-500 hover:border-medical-green-500 hover:text-medical-green-600 hover:bg-medical-green-50 shadow-sm'
                                            }`}
                                        >
                                            <Brain size={14} className={isCompleted || isTesting ? 'hidden' : 'text-medical-green-500'} />
                                            {isCompleted ? 'Test Completado' : isTesting ? 'Realizando Test...' : 'Hacer Test de Autoevaluación'}
                                        </button>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="px-8 md:px-12 py-10 md:py-14">
                                    <div className="prose prose-slate max-w-none 
                                        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-[1.05rem]
                                        prose-strong:text-slate-900 prose-strong:font-bold
                                        prose-h3:text-2xl prose-h3:font-black prose-h3:text-slate-800 prose-h3:mt-12 prose-h3:mb-6
                                        prose-ul:my-6 prose-li:text-slate-600 prose-li:my-2
                                        prose-pre:bg-slate-900 prose-pre:rounded-2xl
                                        prose-table:w-full prose-table:my-8 prose-table:border-collapse prose-table:rounded-2xl prose-table:overflow-hidden prose-table:shadow-sm prose-table:border prose-table:border-slate-100
                                        prose-th:bg-slate-50 prose-th:text-slate-900 prose-th:font-bold prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:py-4 prose-th:px-6 prose-th:text-left
                                        prose-td:py-4 prose-td:px-6 prose-td:text-sm prose-td:text-slate-600 prose-td:border-t prose-td:border-slate-50
                                    ">
                                        {isIndexCard ? (
                                            <div className="flex flex-col gap-3 pt-4">
                                                {blocks.filter(b => b.id !== block.id).map((b, idx) => (
                                                    <button 
                                                        key={b.id}
                                                        onClick={() => scrollToBlock(b.id)}
                                                        className="w-full text-left py-4 px-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-medical-green-50 hover:border-medical-green-200 hover:shadow-lg hover:shadow-medical-green-100/50 transition-all flex items-center justify-between group/btn"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-bold text-medical-green-400 bg-white border border-medical-green-100 w-6 h-6 rounded-lg flex items-center justify-center">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-sm font-bold text-slate-700 group-hover/btn:text-medical-green-800 transition-colors">
                                                                {b.titulo}
                                                            </span>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover/btn:bg-medical-green-500 group-hover/btn:border-medical-green-500 transition-all">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover/btn:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="preview-container">
                                                <style dangerouslySetInnerHTML={{ __html: `
                                                    .preview-container .prose { color: #334155; line-height: 1.6; font-size: 1rem; }
                                                    .preview-container .prose p { margin-bottom: 1.25rem !important; white-space: pre-wrap; }
                                                    .preview-container .prose hr { border: 0; border-top: 2px solid #f1f5f9; margin: 2.5rem 0 !important; }
                                                    .preview-container .prose h3 { font-size: 1.4rem !important; font-weight: 800 !important; color: #0f172a !important; margin-top: 2.5rem !important; margin-bottom: 1rem !important; }
                                                    .preview-container .prose strong { color: #0f172a !important; font-weight: 800 !important; }
                                                    
                                                    .preview-container .prose ul { list-style-type: disc !important; padding-left: 2rem !important; margin-bottom: 1.25rem !important; display: block !important; }
                                                    .preview-container .prose ol { list-style-type: decimal !important; padding-left: 2rem !important; margin-bottom: 1.25rem !important; display: block !important; }
                                                    
                                                    .preview-container .prose li { display: list-item !important; margin-bottom: 0.5rem !important; white-space: normal !important; color: #475569; }
                                                    .preview-container .prose li p { margin: 0 !important; display: inline !important; white-space: normal !important; }
                                                    .preview-container .prose li strong { white-space: normal !important; }
                                                    .preview-container .prose ul li::marker { color: #10b981; font-weight: bold; }
                                                    
                                                    .preview-container .prose table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; white-space: normal !important; }
                                                    .preview-container .prose th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: #64748b; border: 1px solid #e2e8f0; }
                                                    .preview-container .prose td { padding: 10px 14px; border: 1px solid #e2e8f0; font-size: 0.85rem; color: #475569; }
                                                `}} />
                                                <div className="prose max-w-none">
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                                        rehypePlugins={[rehypeRaw]}
                                                    >
                                                        {block.contenido}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            ` }} />
        </div>
    );
};

export default LessonContentViewer;
