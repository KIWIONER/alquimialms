import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { supabase } from '../lib/supabase';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { Brain, CheckCircle, Highlighter, ClipboardList } from 'lucide-react';

/**
 * LESSON CONTENT VIEWER (Student Side)
 * Renders document content as interactive cards with a collapsible section index.
 * Content is fetched from the 'tarjetas' table using the document ID.
 */
const LessonContentViewer = ({ docId, unitName, moduleName }) => {
    const { isLeftSidebarOpen, toggleLeftSidebar } = useUIStore();
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInnerSidebarOpen, setIsInnerSidebarOpen] = useState(true);
    const [completedCardIds, setCompletedCardIds] = useState(new Set());
    const [highlightModeCardId, setHighlightModeCardId] = useState(null); // Tarjeta en modo subrayado manual

    const {
        messages, sendMessage,
        cardHighlights, clearCardHighlights,
        summarizedCardIds, markCardSummarized,
        isTestActive, activeTestingCardId, endTest,
        loading: chatLoading
    } = useChatStore();
    const cardRefs = useRef({});

    // Refs para acceder al DOM renderizado de cada tarjeta y aplicar highlights directamente
    const contentRefs = useRef({});

    // ── Aplica highlights directamente en el DOM con soporte de selección cross-nodo ──
    // Incluye TODOS los nodos de texto (incluso dentro de <mark>) para que los offsets
    // coincidan con lo que el usuario ve y con lo que selection.toString() devuelve.
    const applyHighlightsToDOM = (container, highlights) => {
        if (!container || !highlights || highlights.length === 0) return;

        highlights.forEach(({ text: phrase, occurrence = 0 }) => {
            if (!phrase || phrase.length < 1) return;

            // 1. Índice de TODOS los nodos de texto (sin excluir los ya marcados)
            const textNodes = [];
            let totalOffset = 0;
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                const len = node.textContent.length;
                textNodes.push({ node, start: totalOffset, end: totalOffset + len });
                totalOffset += len;
            }

            // 2. Texto completo = lo mismo que selection.toString() y preRange.toString()
            const fullText  = textNodes.map(t => t.node.textContent).join('');
            const lowerFull = fullText.toLowerCase();
            const lowerPhrase = phrase.toLowerCase();

            // 3. Encontrar la ocurrencia N
            let count = 0, matchStart = -1, pos = 0;
            while (true) {
                const idx = lowerFull.indexOf(lowerPhrase, pos);
                if (idx === -1) break;
                if (count === occurrence) { matchStart = idx; break; }
                count++; pos = idx + 1;
            }
            if (matchStart === -1) return;
            const matchEnd = matchStart + phrase.length;

            // 4. Nodos afectados
            const affected = textNodes.filter(t => t.end > matchStart && t.start < matchEnd);
            if (affected.length === 0) return;

            // 5. Aplicar marks en orden inverso (para no desplazar offsets)
            [...affected].reverse().forEach(({ node: n, start: ns }) => {
                const nodeText = n.textContent || '';
                const localStart = Math.max(0, matchStart - ns);
                const localEnd   = Math.min(nodeText.length, matchEnd - ns);
                const match = nodeText.slice(localStart, localEnd);
                if (!match) return;

                // Si ya está dentro de un <mark>, no hace falta re-envolver
                if (n.parentElement?.tagName === 'MARK') return;

                const before = nodeText.slice(0, localStart);
                const after  = nodeText.slice(localEnd);

                const mark = document.createElement('mark');
                mark.style.cssText = 'background-color:#fef08a;color:#000;border-radius:2px;padding:0 2px;';
                mark.textContent = match;

                const parent = n.parentNode;
                if (before) parent.insertBefore(document.createTextNode(before), n);
                parent.insertBefore(mark, n);
                if (after)  parent.insertBefore(document.createTextNode(after), n);
                parent.removeChild(n);
            });
        });
    };

    // Re-aplica todos los highlights en el DOM después de cada render
    useEffect(() => {
        blocks.forEach(block => {
            const container = contentRefs.current[block.id];
            const highlights = cardHighlights[block.id];
            if (container && highlights?.length > 0) {
                // Primero limpiamos marks existentes (por si el componente re-renderizó)
                container.querySelectorAll('mark').forEach(mark => {
                    const parent = mark.parentNode;
                    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
                    parent.removeChild(mark);
                });
                container.normalize(); // fusionar texto adyacente
                applyHighlightsToDOM(container, highlights);
            }
        });
    }); // sin dependencias: se ejecuta tras CADA render

    useEffect(() => {
        if (docId) {
            fetchTarjetas();
        }
    }, [docId]);

    // Detectar fin de test: marcar tarjeta como completada
    useEffect(() => {
        if (activeTestingCardId && !isTestActive && completedCardIds.has(activeTestingCardId) === false) {
            // El store ya puso isTestActive=false vía endTest()
            // Solo necesitamos reflejar eso en el estado local
            const wasTestingCard = activeTestingCardId;
            if (wasTestingCard) {
                setCompletedCardIds(prev => new Set([...prev, wasTestingCard]));
            }
        }
    }, [isTestActive, activeTestingCardId]);

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

    // ── RESUMIR: solo chat, sin highlights, un solo uso ──
    const handleSummaryClick = async (block) => {
        if (summarizedCardIds.includes(block.id)) return; // ya resumida
        const originalWordCount = block.contenido.split(/\s+/).filter(Boolean).length;
        const maxWords = Math.max(40, Math.floor(originalWordCount * 0.35));
        const prompt = `Resume ÚNICAMENTE la tarjeta "${block.titulo}" en máximo ${maxWords} palabras. Usa SOLO el siguiente texto, sin añadir información externa:
"""
${block.contenido}
"""`;
        await sendMessage(prompt, {
            current_slug: unitName,
            isHidden: true,
            isTestRequest: false,
            blockContent: block.contenido,
            targetBlockId: block.id
        });
    };

    // ── SUBRAYAR: toggle de modo manual ──
    const handleHighlightToggle = (block) => {
        // Toggle modo subrayado
        setHighlightModeCardId(prev => prev === block.id ? null : block.id);
    };

    // Se dispara cuando el usuario suelta el ratón sobre el contenido de una tarjeta
    const handleContentMouseUp = (block, e) => {
        if (highlightModeCardId !== block.id) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const selectedText = selection.toString().trim();
        if (!selectedText || selectedText.length < 2) return;

        // ── Determinar qué ocurrencia (0-indexed) seleccionó el usuario ──
        // Contamos cuántas veces aparece la frase ANTES del inicio de la selección
        // en el texto renderizado del DOM.
        let occurrence = 0;
        try {
            const range = selection.getRangeAt(0);
            const contentDiv = e.currentTarget;
            const preRange = document.createRange();
            preRange.selectNodeContents(contentDiv);
            preRange.setEnd(range.startContainer, range.startOffset);
            const textBefore = preRange.toString().toLowerCase();
            const lowerPhrase = selectedText.toLowerCase();
            let pos = 0;
            while (true) {
                const found = textBefore.indexOf(lowerPhrase, pos);
                if (found === -1) break;
                occurrence++;
                pos = found + 1;
            }
        } catch (_) {}

        const current = useChatStore.getState().cardHighlights[block.id] || [];

        if (e.ctrlKey) {
            // Ctrl+Soltar → eliminar la frase que contenga o esté contenida en la selección
            const sel = selectedText.toLowerCase();
            const updated = current.filter(h => {
                const phrase = (h.text || h).toLowerCase();
                return !phrase.includes(sel) && !sel.includes(phrase);
            });
            useChatStore.getState().setCardHighlights(block.id, updated);
        } else {
            // Clic normal → añadir con índice de ocurrencia
            const isDuplicate = current.some(h => (h.text || h) === selectedText && (h.occurrence ?? 0) === occurrence);
            if (!isDuplicate) {
                useChatStore.getState().setCardHighlights(block.id, [...current, { text: selectedText, occurrence }]);
            }
        }

        selection.removeAllRanges();
    };

    // ── HACER TEST / CONTINUAR TEST ──
    const handleTestClick = async (block) => {
        const isContinuation = isTestActive && activeTestingCardId === block.id;

        if (isContinuation) {
            // El test está activo en esta tarjeta → enviar continuación
            await sendMessage('Continúa con la siguiente pregunta del test.', {
                current_slug: unitName,
                isTestContinuation: true,
                isHidden: true,
                targetBlockId: block.id
            });
        } else {
            // Test nuevo
            const prompt = `Genérame un mini-test de exactamente 5 preguntas sobre "${block.titulo}".
REGLAS:
1. SIEMPRE EN ESPAÑOL.
2. USA SOLO el texto proporcionado.
3. UNA pregunta a la vez, con 4 opciones (a/b/c/d).
4. Tras mi respuesta: feedback breve + siguiente pregunta.
5. Tras la pregunta 5: escribe [[COMPLETADO]].

Texto:
${block.contenido}`;
            await sendMessage(prompt, {
                current_slug: unitName,
                isTestRequest: true,
                isHidden: true,
                blockContent: block.contenido,
                targetBlockId: block.id
            });
        }
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
            
            {/* 1. Toggle Button for Primary Sidebar (Floating) */}
            <button 
                onClick={toggleLeftSidebar}
                className={`absolute left-4 top-4 z-40 p-2.5 bg-white rounded-full shadow-md border border-slate-200 text-slate-400 hover:text-medical-green-600 transition-all hover:scale-110 active:scale-95 ${isLeftSidebarOpen ? 'translate-x-0' : 'translate-x-0'}`}
                title={isLeftSidebarOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isLeftSidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
            </button>

            {/* 2. Section Navigation Sidebar (Inner) */}
            <aside 
                className={`fixed md:relative z-30 h-full bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none flex flex-col ${isInnerSidebarOpen ? 'w-[280px] opacity-100' : 'w-0 opacity-0 -translate-x-full md:translate-x-0'}`}
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
                                key={`${block.id}-${JSON.stringify(cardHighlights[block.id])}`}
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
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button 
                                                onClick={() => handleSummaryClick(block)}
                                                disabled={summarizedCardIds.includes(block.id) || chatLoading}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                                                    summarizedCardIds.includes(block.id)
                                                        ? 'bg-amber-100 border border-amber-200 text-amber-600 cursor-default'
                                                        : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300'
                                                }`}
                                            >
                                                <Brain size={14} className="text-amber-500" />
                                                {summarizedCardIds.includes(block.id) ? '✓ Resumido' : 'Resumir'}
                                            </button>

                                            {/* Botón Subrayar - modo manual */}
                                            {(() => {
                                                const isModeActive = highlightModeCardId === block.id;
                                                const hasHighlights = (cardHighlights[block.id]?.length || 0) > 0;
                                                return (
                                                    <button
                                                        onClick={() => handleHighlightToggle(block)}
                                                        title={isModeActive ? 'Clic: desactivar modo. Ctrl+Clic sobre texto para borrar subrayado.' : 'Activar subrayador manual'}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
                                                            isModeActive
                                                                ? 'bg-yellow-400 border border-yellow-500 text-yellow-900 ring-2 ring-yellow-300 ring-offset-1'
                                                                : hasHighlights
                                                                    ? 'bg-yellow-100 border border-yellow-300 text-yellow-800 hover:bg-yellow-200'
                                                                    : 'bg-white border border-slate-200 text-slate-500 hover:border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50'
                                                        }`}
                                                    >
                                                        <Highlighter size={14} className={isModeActive ? 'text-yellow-800 animate-pulse' : hasHighlights ? 'text-yellow-600' : 'text-slate-400'} />
                                                        {isModeActive ? 'Subrayando...' : hasHighlights ? 'Subrayado ✓' : 'Subrayar'}
                                                    </button>
                                                );
                                            })()}

                                            {/* Botón Hacer Test / Continuar Test */}
                                            <button
                                                onClick={() => handleTestClick(block)}
                                                disabled={isCompleted || chatLoading}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                                                    isCompleted
                                                        ? 'bg-medical-green-200 text-medical-green-700 cursor-default'
                                                        : isTesting
                                                            ? 'bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200 animate-pulse-subtle'
                                                            : 'bg-white border border-slate-200 text-slate-500 hover:border-medical-green-500 hover:text-medical-green-600 hover:bg-medical-green-50'
                                                }`}
                                            >
                                                {isCompleted
                                                    ? <><CheckCircle size={14} className="text-medical-green-600" /> Completado</>
                                                    : isTesting
                                                        ? <><ClipboardList size={14} className="text-blue-600" /> Continuar Test</>
                                                        : <><ClipboardList size={14} className="text-slate-400" /> Hacer Test</>
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>


                                {/* Card Body */}
                                <div
                                    className="px-8 md:px-12 py-10 md:py-14"
                                    onMouseUp={(e) => handleContentMouseUp(block, e)}
                                    style={{ cursor: highlightModeCardId === block.id ? 'text' : 'auto' }}
                                >
                                    {highlightModeCardId === block.id && (
                                        <div className="mb-4 flex items-center gap-2 text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
                                            <Highlighter size={12} className="text-yellow-500 animate-pulse" />
                                            <span><strong>Modo subrayado activo.</strong> Arrastra para subrayar. <span className="opacity-60">Ctrl+Clic sobre texto seleccionado para borrar ese subrayado.</span></span>
                                        </div>
                                    )}
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
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
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
                                                <div
                                                    className="prose max-w-none"
                                                    ref={el => { contentRefs.current[block.id] = el; }}
                                                >
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
