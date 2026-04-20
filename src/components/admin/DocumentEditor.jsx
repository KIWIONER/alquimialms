import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { supabase } from '../../lib/supabase';
import RichCardEditor from './RichCardEditor';
import { toKebabCase, splitIntoBlocks, joinBlocks, isIndexTitle } from '../../lib/content';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

// Dnd Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// --- SUB-COMPONENTES AUXILIARES (DEFINIDOS FUERA PARA EVITAR RE-RENDER) ---

const SortableDocItem = ({ id, doc, isSelected, onSelect, onRename }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: 10 };
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(doc.nombre);
    
    const handleSave = () => { onRename(doc.id, tempName); setIsEditing(false); };
    
    return (
        <div ref={setNodeRef} style={style} className="mb-1.5 flex items-center group/doc mr-2">
            <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-slate-300 group-hover/doc:text-slate-500 transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 8h16M4 16h16" /></svg>
            </div>
            <div className={`flex-1 flex items-center gap-3 py-2.5 px-4 rounded-xl border transition-all ${isSelected ? 'bg-white border-medical-green-500 shadow-md ring-2 ring-medical-green-50' : 'border-transparent text-slate-400 hover:bg-white hover:border-slate-100 hover:shadow-sm'}`}>
                {isEditing ? (
                    <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} className="bg-transparent border-none text-slate-900 font-bold text-[11px] uppercase tracking-wider focus:outline-none w-full" />
                ) : (
                    <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden" onClick={() => onSelect(doc)}>
                        <span className="truncate font-black text-[11px] uppercase tracking-wider cursor-pointer whitespace-nowrap">{doc.nombre}</span>
                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="opacity-0 group-hover/doc:opacity-100 p-1 hover:text-medical-green-600 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SortableIndexItem = ({ id, index, titulo, onSelect, isActive, isSelected, onToggleSelect, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, position: 'relative', zIndex: 10 };
    
    return (
        <div ref={setNodeRef} style={style} className="mb-2 relative group/item">
            {/* CHECKBOX SELECTION */}
            <div className="absolute -left-9 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(id); }}
                    className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-medical-green-500 border-medical-green-500 text-white shadow-sm' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                >
                    {isSelected && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                </button>
            </div>

            <div className="flex items-center gap-2">
                {/* QUICK DELETE (ROJO) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('¿Borrar esta tarjeta?')) onDelete(id); }}
                    className="opacity-0 group-hover/item:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Eliminar tarjeta"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <button onClick={onSelect} className={`flex-1 text-left py-2.5 px-4 rounded-xl flex items-start gap-4 transition-all border-2 ${isActive ? 'bg-medical-green-500 text-white border-medical-green-500 shadow-lg' : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200 hover:shadow-sm'}`}>
                    <span className={`flex-shrink-0 text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center border mt-0.5 ${isActive ? 'bg-medical-green-600 border-medical-green-400' : 'bg-slate-50 border-slate-100'}`}>{index + 1}</span>
                    <span className="text-[13px] font-bold leading-tight whitespace-normal break-words flex-1 tracking-tight">{titulo || 'Sin título'}</span>
                    <div {...attributes} {...listeners} className={`p-1 cursor-grab active:cursor-grabbing transition-colors ${isActive ? 'text-medical-green-200 hover:text-white' : 'text-slate-300 hover:text-slate-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" /></svg>
                    </div>
                </button>
            </div>
        </div>
    );
};

const SortableCard = React.forwardRef(({ t, index, selectedCardId, setSelectedCardId, updateLocalTarjeta, deleteTarjeta, onSplitIA, previewModes, setPreviewModes, activeEditorRef, setActiveEditorState, isCollapsed, toggleCollapse }, ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: 'relative', zIndex: 1 };

    return (
        <div ref={setNodeRef} style={style} className="group/card relative">
            {/* ANCLA PARA SCROLL */}
            <div ref={ref} className="absolute -top-32" id={`card-${t.id}`} />
            
            <div className={`bg-white rounded-[3rem] border-2 transition-all p-12 ${selectedCardId === t.id ? 'border-medical-green-500 shadow-2xl scale-[1.02]' : 'border-slate-50 shadow-sm opacity-90'}`} onClick={() => setSelectedCardId(t.id)}>
                <div className="flex items-start gap-6 mb-8 pb-8 border-b border-slate-50">
                    <div {...attributes} {...listeners} className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black cursor-grab active:cursor-grabbing hover:bg-medical-green-600 transition-colors shrink-0 mt-1">{index + 1}</div>
                    <textarea 
                        value={t.titulo || ''} 
                        onChange={e => {
                            updateLocalTarjeta(t.id, { titulo: e.target.value });
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }} 
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:outline-none font-bold text-xl text-slate-800 leading-tight py-1 resize-none overflow-hidden" 
                        placeholder="Título del tema..."
                        onFocus={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                    />
                    
                    <div className="flex items-center gap-3 mt-1">
                        <button onClick={(e) => { e.stopPropagation(); onSplitIA(t.id); }} className="p-2 rounded-xl border border-slate-100 bg-slate-50 text-medical-green-600 hover:bg-medical-green-500 hover:text-white transition-all shadow-sm" title="Perfeccionar con IA">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); toggleCollapse(t.id); }} className={`p-2 rounded-xl border transition-all ${isCollapsed ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                            <svg className={`h-5 w-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <button onClick={() => setPreviewModes(p => ({ ...p, [t.id]: !p[t.id] }))} className="text-[10px] font-black bg-slate-50 px-6 py-2 rounded-xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">{previewModes[t.id] ? 'Editor' : 'Preview'}</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteTarjeta(t.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="select-text min-h-[300px] animate-in fade-in slide-in-from-top-4 duration-500">
                        {previewModes[t.id] ? (
                            <div className="prose prose-slate max-w-none card-preview"><ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>{t.contenido}</ReactMarkdown></div>
                        ) : (
                            <RichCardEditor content={t.contenido} onChange={val => updateLocalTarjeta(t.id, { contenido: val })} onFocus={ed => { activeEditorRef.current = ed; setActiveEditorState(ed); setSelectedCardId(t.id); }} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

// --- COMPONENTE PRINCIPAL ---

const DocumentEditor = () => {
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [tarjetas, setTarjetas] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [previewModes, setPreviewModes] = useState({});
    const [activeEditorState, setActiveEditorState] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedBulkIds, setSelectedBulkIds] = useState(new Set());
    const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
    const [collapsedCards, setCollapsedCards] = useState(new Set());
    const [showPdf, setShowPdf] = useState(false);
    const [pdfWidth, setPdfWidth] = useState(45);
    const [isResizing, setIsResizing] = useState(false);
    const [docOrderMaps, setDocOrderMaps] = useState(() => { if (typeof window !== 'undefined') { const saved = localStorage.getItem('alquimia_docs_order'); return saved ? JSON.parse(saved) : {}; } return {}; });
    
    const activeEditorRef = useRef(null);
    const cardsScrollRef = useRef(null);
    const cardRefs = useRef({});
    const autosaveTimers = useRef({});

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => { fetchDocuments(); }, []);

    useEffect(() => {
        if (selectedCardId && cardRefs.current[selectedCardId]) {
            cardRefs.current[selectedCardId].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedCardId]);

    const fetchDocuments = async () => {
        try { 
            const { data, error } = await supabase.schema('nutricionista').from('documentos').select('id, nombre, carpeta, url').order('nombre'); 
            if (error) throw error; 
            setDocuments(data || []);
        } catch (err) { console.error('Error docs:', err); }
    };

    const fetchTarjetas = async (docId) => {
        try { 
            const { data, error } = await supabase.schema('nutricionista').from('tarjetas').select('*').eq('documento_id', docId).order('orden'); 
            if (error) throw error; 
            setTarjetas(data || []); 
            if (data?.length > 0) setSelectedCardId(data[0].id);
        } catch (err) { console.error('Error temas:', err); }
    };

    const groupedDocs = useMemo(() => {
        const groups = {};
        documents.forEach(doc => { const f = doc.carpeta || 'General'; if (!groups[f]) groups[f] = []; groups[f].push(doc); });
        Object.keys(groups).forEach(folder => {
            const order = docOrderMaps[folder] || [];
            groups[folder].sort((a, b) => {
                const idxA = order.indexOf(a.id); const idxB = order.indexOf(b.id);
                if (idxA === -1 && idxB === -1) return a.nombre.localeCompare(b.nombre, undefined, { numeric: true });
                if (idxA === -1) return 1; if (idxB === -1) return -1;
                return idxA - idxB;
            });
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [documents, docOrderMaps]);

    const handleSelectDoc = (doc) => { setTarjetas([]); setSelectedCardId(null); setActiveEditorState(null); activeEditorRef.current = null; setSelectedDoc(doc); fetchTarjetas(doc.id); };
    const toggleFolder = (folder) => { setExpandedFolders(prev => { const next = new Set(prev); if (next.has(folder)) next.delete(folder); else next.add(folder); return next; }); };
    
    const renameDoc = async (id, newName) => {
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, nombre: newName } : d));
        setSaveStatus('saving');
        try { await supabase.schema('nutricionista').from('documentos').update({ nombre: newName }).eq('id', id); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); } catch { setSaveStatus('idle'); }
    };

    const handleReorderDocs = (folder, event) => {
        const { active, over } = event; if (!over || active.id === over.id) return;
        const folderDocs = documents.filter(d => (d.carpeta || 'General') === folder);
        const oldIndex = folderDocs.findIndex(d => d.id === active.id); const newIndex = folderDocs.findIndex(d => d.id === over.id);
        const newFolderDocs = arrayMove(folderDocs, oldIndex, newIndex);
        const newOrder = newFolderDocs.map(d => d.id);
        const newDocOrderMaps = { ...docOrderMaps, [folder]: newOrder };
        setDocOrderMaps(newDocOrderMaps);
        localStorage.setItem('alquimia_docs_order', JSON.stringify(newDocOrderMaps));
    };

    const updateLocalTarjeta = (id, fields) => {
        setTarjetas(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t));
        setSaveStatus('saving');
        
        if (autosaveTimers.current[id]) clearTimeout(autosaveTimers.current[id]);
        autosaveTimers.current[id] = setTimeout(async () => {
            try {
                const updateData = { updated_at: new Date().toISOString() };
                if (fields.titulo !== undefined) updateData.titulo = fields.titulo;
                if (fields.contenido !== undefined) updateData.contenido = fields.contenido;

                const { error } = await supabase.schema('nutricionista').from('tarjetas').update(updateData).eq('id', id);
                if (error) throw error;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Save error:', err);
                setSaveStatus('idle');
            }
        }, 1500);
    };

    const handleManualSave = async () => {
        if (!selectedDoc || tarjetas.length === 0) return;
        setSaveStatus('saving');
        try {
            const updates = tarjetas.map((t, idx) => ({ id: t.id, documento_id: selectedDoc.id, titulo: t.titulo, contenido: t.contenido, orden: idx, updated_at: new Date().toISOString() }));
            const { error } = await supabase.schema('nutricionista').from('tarjetas').upsert(updates);
            if (error) throw error;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch { setSaveStatus('idle'); }
    };

    const handleAddCard = async () => {
        if (!selectedDoc) return;
        const newCard = {
            id: crypto.randomUUID(),
            documento_id: selectedDoc.id,
            titulo: 'Nuevo Tema',
            contenido: '',
            orden: tarjetas.length,
            created_at: new Date().toISOString()
        };
        setTarjetas([...tarjetas, newCard]);
        setSelectedCardId(newCard.id);
        setSaveStatus('saving');
        try {
            await supabase.schema('nutricionista').from('tarjetas').insert(newCard);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch { setSaveStatus('idle'); }
    };

    const handleDeleteCard = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar esta tarjeta?')) return;
        setTarjetas(prev => prev.filter(t => t.id !== id));
        setSaveStatus('saving');
        try {
            await supabase.schema('nutricionista').from('tarjetas').delete().eq('id', id);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch { setSaveStatus('idle'); }
    };

    const handlePerfectCardWithIA = async (id) => {
        const tarjeta = tarjetas.find(t => t.id === id);
        if (!tarjeta || !tarjeta.contenido) return;

        setIsProcessing(true);
        try {
            const response = await fetch(import.meta.env.PUBLIC_N8N_CEREBRO_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'perfect', 
                    content: tarjeta.contenido, 
                    instructions: "Limpia el texto proveniente de PDF, identifica listas, añade negritas relevantes y organiza el contenido para que sea altamente legible. MANTÉN el contenido en un solo bloque, no añadidas nuevos títulos ##."
                })
            });

            if (!response.ok) throw new Error('Error en la comunicación con la IA');
            const data = await response.json();
            const improvedText = typeof data === 'string' ? data : data.text || data.content;

            if (!improvedText) throw new Error('La IA devolvió un contenido vacío');

            // Actualizar tarjeta actual
            updateLocalTarjeta(id, { contenido: improvedText });
            
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Error Perfect IA:', err);
            alert('No se pudo perfeccionar la tarjeta.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAutoStructure = async () => {
        if (!selectedDoc) return;
        if (tarjetas.length > 0 && !confirm('Atención: La IA re-estructurará todo el documento y reemplazará las tarjetas actuales. ¿Deseas continuar?')) return;

        setIsProcessing(true);
        setToolsMenuOpen(false);
        try {
            // 1. Obtener contenido base del documento (o unir tarjetas actuales si no hay base)
            const { data: docData } = await supabase.schema('nutricionista').from('documentos').select('contenido').eq('id', selectedDoc.id).single();
            const rawContent = docData?.contenido || joinBlocks(tarjetas);

            if (!rawContent) throw new Error('No hay contenido para procesar');

            // 2. Llamar a n8n
            const response = await fetch(import.meta.env.PUBLIC_N8N_CEREBRO_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'structure', content: rawContent, docName: selectedDoc.nombre })
            });

            if (!response.ok) throw new Error('Error en la comunicación con la IA');
            const data = await response.json();
            const structuredMarkdown = typeof data === 'string' ? data : data.text || data.content;

            if (!structuredMarkdown || structuredMarkdown.length < 50) {
                throw new Error('La IA ha devuelto un resultado vacío o demasiado corto. No se ha modificado el documento por seguridad.');
            }

            // 3. Split y guardar
            const newBlocks = splitIntoBlocks(structuredMarkdown);
            
            // Si el documento actual tiene mucho contenido y la IA devuelve un solo bloque, algo va mal
            if (tarjetas.length > 3 && newBlocks.length <= 1) {
                throw new Error('La IA no ha podido estructurar el contenido en bloques. Se cancela el proceso para no perder las tarjetas actuales.');
            }

            const newCards = newBlocks.map((b, i) => ({
                id: crypto.randomUUID(),
                documento_id: selectedDoc.id,
                titulo: b.title,
                contenido: b.content,
                orden: i
            }));

            // Limpiar anteriores e insertar nuevas (SOLO SI LLEGAMOS AQUÍ)
            const { error: delError } = await supabase.schema('nutricionista').from('tarjetas').delete().eq('documento_id', selectedDoc.id);
            if (delError) throw delError;

            const { error: insError } = await supabase.schema('nutricionista').from('tarjetas').insert(newCards);
            if (insError) throw insError;

            setTarjetas(newCards);
            if (newCards.length > 0) setSelectedCardId(newCards[0].id);
            setSaveStatus('saved');
        } catch (err) {
            console.error('Error IA:', err);
            alert('Error al estructurar el documento: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateIndex = async () => {
        if (!tarjetas.length || !selectedDoc) return;
        setSaveStatus('saving');
        try {
            // Recopilar títulos de temas (excluyendo el propio índice si existe)
            const temas = tarjetas.filter(t => !isIndexTitle(t.titulo)).map(t => t.titulo);
            const indexContent = temas.map((titulo, i) => `${i + 1}. ${titulo}`).join('\n');
            
            // Buscar si ya existe una tarjeta de índice
            let indexCard = tarjetas.find(t => isIndexTitle(t.titulo));
            
            if (indexCard) {
                // Actualizar existente
                const { error } = await supabase.schema('nutricionista').from('tarjetas').update({ contenido: indexContent }).eq('id', indexCard.id);
                if (error) throw error;
                setTarjetas(prev => prev.map(t => t.id === indexCard.id ? { ...t, contenido: indexContent } : t));
            } else {
                // Crear nueva al principio
                const newIndex = {
                    documento_id: selectedDoc.id,
                    titulo: 'Índice',
                    contenido: indexContent,
                    orden: -1 // Forzar que sea la primera
                };
                const { data, error } = await supabase.schema('nutricionista').from('tarjetas').insert(newIndex).select();
                if (error) throw error;
                // Recargar tarjetas para asegurar orden correcto
                await fetchTarjetas(selectedDoc.id);
            }
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Error index:', err);
            setSaveStatus('idle');
        }
    };

    const toggleCardSelection = (id) => {
        setSelectedBulkIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedBulkIds.size === tarjetas.length) setSelectedBulkIds(new Set());
        else setSelectedBulkIds(new Set(tarjetas.map(t => t.id)));
    };

    const handleDeleteBulk = async () => {
        if (selectedBulkIds.size === 0) return;
        if (!confirm(`¿Estás seguro de eliminar las ${selectedBulkIds.size} tarjetas seleccionadas?`)) return;

        setSaveStatus('saving');
        try {
            const idsToDelete = Array.from(selectedBulkIds);
            const { error } = await supabase.schema('nutricionista').from('tarjetas').delete().in('id', idsToDelete);
            if (error) throw error;
            
            setTarjetas(prev => prev.filter(t => !selectedBulkIds.has(t.id)));
            setSelectedBulkIds(new Set());
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error('Error bulk delete:', err);
            setSaveStatus('idle');
        }
    };

    const toggleCollapse = (id) => {
        setCollapsedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCollapseAll = () => setCollapsedCards(new Set(tarjetas.map(t => t.id)));
    const handleExpandAll = () => setCollapsedCards(new Set());
    
    // LOGICA DE RESIZER
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            const containerWidth = window.innerWidth;
            const newWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
            if (newWidth > 15 && newWidth < 80) setPdfWidth(newWidth);
        };

        const handleMouseUp = () => setIsResizing(false);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div className="flex flex-col h-full w-full bg-[#fcfcfc] overflow-hidden text-slate-900 font-sans">
            {/* CABECERA GLOBAL INTEGRADA */}
            <header className="h-20 border-b border-slate-100 bg-white flex items-center px-10 justify-between shrink-0 z-[110] shadow-sm sticky top-0">
                <div className="flex items-center gap-6">
                    <a href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-medical-green-600 transition-all group/back">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover/back:bg-medical-green-50 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden lg:block">Panel de Control</span>
                    </a>
                    <div className="w-px h-6 bg-slate-100 mx-2"></div>
                    <div className="flex flex-col">
                        <h1 className="font-extrabold text-lg tracking-tight text-slate-800 leading-none">Admin <span className="text-medical-green-500 italic">Editor</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">En línea</span>
                        </div>
                    </div>
                </div>

                {/* TEXT TOOLS - CENTRADOS */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-50/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-100">
                     <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().toggleBold().run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive('bold') ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-500 font-bold'}`}>B</button>
                     <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().toggleItalic().run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive('italic') ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-500 italic font-serif text-lg'}`}>I</button>
                     <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().toggleHeading({ level: 3 }).run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive('heading', { level: 3 }) ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-500 font-black text-[11px]'}`}>H3</button>
                     <div className="w-px h-5 bg-slate-200 mx-1.5"></div>
                     <button onClick={handleUpdateIndex} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-medical-green-600 transition-all border border-transparent hover:border-slate-100" title="Actualizar Índice">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        Índice
                     </button>
                     <div className="w-px h-5 bg-slate-200 mx-1.5"></div>
                     <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().toggleBulletList().run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive('bulletList') ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-500'}`}><svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                     <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().toggleOrderedList().run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive('orderedList') ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-500'}`}><svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg></button>
                     <div className="w-px h-5 bg-slate-200 mx-1.5"></div>
                     <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().setTextAlign('left').run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive({ textAlign: 'left' }) ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-500'}`}><svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M4 12h10M4 18h16" /></svg></button>
                     <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().setTextAlign('center').run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive({ textAlign: 'center' }) ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-white text-slate-500'}`}><svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M7 12h10M4 18h16" /></svg></button>
                     <div className="w-px h-5 bg-slate-200 mx-1.5"></div>
                     
                     {/* TABLAS - CONTEXTUAL */}
                     <div className="relative flex items-center gap-1">
                        <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().insertTable({ rows: 2, cols: 3 }).run(); }} className={`w-10 h-10 rounded-xl transition-all ${activeEditorState?.isActive('table') ? 'bg-medical-green-500 text-white shadow-lg' : 'hover:bg-white text-slate-500'}`} title="Insertar Tabla">
                            <svg className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M3 10h18M3 14h18m-9-4v8" /></svg>
                        </button>
                        
                        {activeEditorState?.isActive('table') && (
                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300 ml-1 border-l border-slate-200 pl-2">
                                <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().addRowAfter().run(); }} className="w-8 h-8 rounded-lg hover:bg-white text-slate-400 hover:text-medical-green-600 transition-all flex items-center justify-center" title="Añadir Fila">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M3 12h18M12 3v18" /></svg>
                                </button>
                                <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().addColumnAfter().run(); }} className="w-8 h-8 rotate-90 rounded-lg hover:bg-white text-slate-400 hover:text-medical-green-600 transition-all flex items-center justify-center" title="Añadir Columna">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M3 12h18M12 3v18" /></svg>
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().deleteRow().run(); }} className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all flex items-center justify-center" title="Borrar Fila">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().deleteTable().run(); }} className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all flex items-center justify-center" title="Eliminar Tabla">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        )}
                     </div>
                </div>

                {/* ACCIONES Y ESTADO - DERECHA */}
                <div className="flex items-center gap-4">
                    <button onClick={handleAddCard} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                        NUEVA
                    </button>

                    <div className="relative">
                        <button onClick={() => setToolsMenuOpen(!toolsMenuOpen)} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${toolsMenuOpen ? 'bg-medical-green-500 text-white border-medical-green-500' : 'bg-white text-medical-green-600 border-medical-green-100 hover:border-medical-green-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            IA
                        </button>
                        {toolsMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[110]" onClick={() => setToolsMenuOpen(false)}></div>
                                <div className="absolute right-0 mt-3 w-72 bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[2rem] shadow-2xl z-[120] p-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                                    <div className="p-4 mb-2 border-b border-slate-50 flex items-center gap-3 text-medical-green-600">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9l-.707.707M12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inteligencia Artificial</span>
                                    </div>
                                    <button onClick={handleAutoStructure} className="w-full text-left p-4 rounded-2xl hover:bg-medical-green-50 flex items-center gap-4 transition-all group/tool">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover/tool:bg-white flex items-center justify-center text-xl shadow-sm transition-all">🪄</div>
                                        <div className="flex-1">
                                            <div className="text-[11px] font-black uppercase text-slate-800 tracking-tight">Auto-Estructurar</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">Analizar y crear temas</div>
                                        </div>
                                    </button>
                                    <button onClick={() => {
                                        const cleaned = tarjetas.map(t => ({ ...t, contenido: t.contenido.replace(/\*\*\s*(.+?)\s*\*\*/gs, '**$1**') }));
                                        setTarjetas(cleaned); handleManualSave(); setToolsMenuOpen(false);
                                    }} className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 flex items-center gap-4 transition-all group/tool">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover/tool:bg-white flex items-center justify-center text-xl shadow-sm transition-all">✨</div>
                                        <div className="flex-1">
                                            <div className="text-[11px] font-black uppercase text-slate-800 tracking-tight">Limpiar</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">Compactar negritas</div>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button onClick={handleManualSave} className="bg-medical-green-600 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-medical-green-700 shadow-md active:scale-95 transition-all">GUARDAR</button>
                    
                    <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-4">
                        <span className={`w-3 h-3 rounded-full ${saveStatus === 'saving' ? 'bg-orange-500 animate-pulse' : saveStatus === 'saved' ? 'bg-medical-green-500' : 'bg-slate-200 shadow-inner'}`} />
                        <span className="text-[7px] font-bold uppercase text-slate-400 tracking-[0.2em] mt-1">Sync</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* PANEL 1: NAV */}
                <div className={`w-[360px] h-full bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-500 z-50 ${sidebarOpen ? '' : '-ml-[360px]'}`}>
                <div className="p-10 border-b border-slate-50 shrink-0 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-[2rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-4xl shadow-sm">🏺</div>
                    <div>
                        <h2 className="text-[14px] font-black uppercase tracking-[0.4em]">Alquimia</h2>
                        <p className="text-[10px] font-black text-medical-green-600 uppercase tracking-widest mt-1">Admin Panel</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-4">
                    {groupedDocs.map(([folder, docs]) => (
                        <div key={folder} className="mb-4">
                            <button onClick={() => toggleFolder(folder)} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${expandedFolders.has(folder) ? 'bg-medical-green-500' : 'bg-slate-200'}`} />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-800">{folder}</span>
                                </div>
                                <svg className={`h-4 w-4 transition-transform ${expandedFolders.has(folder) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg>
                            </button>
                            {expandedFolders.has(folder) && (
                                <div className="pl-4 mt-2 space-y-1">
                                    <DndContext sensors={sensors} onDragEnd={(e) => handleReorderDocs(folder, e)}>
                                        <SortableContext items={docs.map(d => d.id)} strategy={verticalListSortingStrategy}>
                                            {docs.map(doc => <SortableDocItem key={doc.id} id={doc.id} doc={doc} isSelected={selectedDoc?.id === doc.id} onSelect={handleSelectDoc} onRename={renameDoc} />)}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* PANEL 2: ÍNDICE */}
            {selectedDoc && (
                <div className="w-[400px] h-full bg-slate-50 border-r border-slate-100 flex flex-col shrink-0 z-40">
                    <div className="p-10 border-b border-slate-100 bg-white/50 text-center shrink-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-2">Contenido de Unidad</span>
                        <h3 className="text-[13px] font-black uppercase tracking-tight mb-4">{selectedDoc.nombre}</h3>
                        
                        {/* BULK ACTIONS TOOLBAR */}
                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100">
                            <button onClick={toggleSelectAll} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all">
                                {selectedBulkIds.size === tarjetas.length ? 'Desmarcar' : 'Todos'}
                            </button>
                            {selectedBulkIds.size > 0 && (
                                <button onClick={handleDeleteBulk} className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Borrar ({selectedBulkIds.size})
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pl-12 space-y-2">
                        <DndContext sensors={sensors} onDragEnd={async (event) => {
                            const { active, over } = event; if (!over || active.id === over.id) return;
                            const oldIdx = tarjetas.findIndex(t => t.id === active.id); const newIdx = tarjetas.findIndex(t => t.id === over.id);
                            const newTs = arrayMove(tarjetas, oldIdx, newIdx); setTarjetas(newTs);
                            setSaveStatus('saving');
                            try {
                                const ups = newTs.map((t, i) => ({ id: t.id, orden: i, documento_id: selectedDoc.id, titulo: t.titulo, contenido: t.contenido, updated_at: new Date().toISOString() }));
                                await supabase.schema('nutricionista').from('tarjetas').upsert(ups); setSaveStatus('saved');
                                setTimeout(() => setSaveStatus('idle'), 2000);
                            } catch { setSaveStatus('idle'); }
                        }}>
                            <SortableContext items={tarjetas.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                {tarjetas.map((t, i) => (
                                    <SortableIndexItem 
                                        key={t.id} 
                                        id={t.id} 
                                        index={i} 
                                        titulo={t.titulo} 
                                        isActive={selectedCardId === t.id} 
                                        isSelected={selectedBulkIds.has(t.id)}
                                        onToggleSelect={toggleCardSelection}
                                        onDelete={handleDeleteCard}
                                        onSelect={() => setSelectedCardId(t.id)} 
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            )}

            {/* PANEL 3: EDITOR */}
            <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#fdfcfb]">
                {/* EDITOR HEADER CON TOGGLE Y ESTADO */}
                <div className="h-14 px-12 border-b border-slate-50 flex items-center bg-white/50 backdrop-blur-md z-[100] shrink-0 gap-8">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <svg className={`h-5 w-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M11 19l-7-7 7-7" /></svg>
                    </button>
                    {selectedDoc && (
                        <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Editando</span>
                                <span className="text-[11px] font-black uppercase text-slate-800 truncate max-w-md">{selectedDoc.nombre}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {selectedDoc.url && (
                                    <button onClick={() => setShowPdf(!showPdf)} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${showPdf ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'text-medical-green-600 bg-medical-green-50 hover:bg-medical-green-100 border-medical-green-200'}`}>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path d="M9 13h6m-6 4h6m-6-8h1" /></svg>
                                        Visor PDF
                                    </button>
                                )}
                                <div className="w-px h-4 bg-slate-100 mx-2"></div>
                                <button onClick={handleCollapseAll} className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 11l7 7 7-7" /></svg>
                                    Colapsar Todo
                                </button>
                                <button onClick={handleExpandAll} className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100">
                                    <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 11l7 7 7-7" /></svg>
                                    Expandir Todo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SCROLL DE TARJETAS */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[200] flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-slate-100">
                                <div className="w-12 h-12 border-4 border-medical-green-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-[0.3em] text-slate-800">Alquimizando...</h3>
                            <p className="text-slate-400 text-sm mt-4 font-medium italic">La IA está estructurando tu contenido</p>
                        </div>
                    )}

                    {selectedDoc ? (
                        <div className="max-w-4xl mx-auto space-y-16 pb-96">
                            <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={async (event) => {
                                const { active, over } = event; if (!over || active.id === over.id) return;
                                const oldIdx = tarjetas.findIndex(t => t.id === active.id); const newIdx = tarjetas.findIndex(t => t.id === over.id);
                                const newTs = arrayMove(tarjetas, oldIdx, newIdx); setTarjetas(newTs);
                                setSaveStatus('saving');
                                try {
                                    const ups = newTs.map((t, i) => ({ id: t.id, orden: i, documento_id: selectedDoc.id, titulo: t.titulo, contenido: t.contenido, updated_at: new Date().toISOString() }));
                                    await supabase.schema('nutricionista').from('tarjetas').upsert(ups); setSaveStatus('saved');
                                    setTimeout(() => setSaveStatus('idle'), 2000);
                                } catch { setSaveStatus('idle'); }
                            }}>
                                <SortableContext items={tarjetas.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                    {tarjetas.map((t, i) => (
                                        <SortableCard 
                                            key={t.id} 
                                            t={t} 
                                            index={i} 
                                            selectedCardId={selectedCardId} 
                                            setSelectedCardId={setSelectedCardId}
                                            updateLocalTarjeta={updateLocalTarjeta}
                                            deleteTarjeta={handleDeleteCard}
                                            onSplitIA={handlePerfectCardWithIA}
                                            previewModes={previewModes}
                                            setPreviewModes={setPreviewModes}
                                            activeEditorRef={activeEditorRef}
                                            setActiveEditorState={setActiveEditorState}
                                            isCollapsed={collapsedCards.has(t.id)}
                                            toggleCollapse={toggleCollapse}
                                            ref={el => (cardRefs.current[t.id] = el)}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                            <div className="text-9xl mb-8">🏺</div>
                            <span className="text-2xl font-black uppercase tracking-[1em]">Alquimia LMS</span>
                        </div>
                    )}
                </div>
            </div>

            {/* EJE VERTICAL (RESIZER) */}
            {showPdf && (
                <div 
                    onMouseDown={handleMouseDown}
                    className={`w-[6px] h-full cursor-col-resize hover:bg-medical-green-400 bg-slate-200 transition-colors z-[100] active:bg-medical-green-600 shrink-0 relative flex items-center justify-center`}
                    title="Arrastra para redimensionar"
                >
                    <div className="w-[1px] h-10 bg-white/50 rounded-full"></div>
                </div>
            )}

            {/* PANEL 4: PDF VIEWER (SIDE-BY-SIDE RESIZABLE) */}
            {showPdf && selectedDoc?.url && (
                <div 
                    style={{ width: `${pdfWidth}%` }} 
                    className="border-l border-slate-200 bg-slate-100 h-full flex flex-col relative z-[90] shrink-0"
                >
                    <div className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-medical-green-50 flex items-center justify-center text-medical-green-600">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path d="M9 13h6m-6 4h6m-6-8h1" /></svg>
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Documento Original</span>
                        </div>
                    </div>
                    <div className={`flex-1 bg-slate-500 overflow-hidden relative ${isResizing ? 'pointer-events-none' : ''}`}>
                        <iframe src={`${selectedDoc.url}#view=FitH`} className="w-full h-full border-none" title="Original PDF" />
                    </div>
                </div>
            )}
        </div>
        <style dangerouslySetInnerHTML={{ 
            __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; } 
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                /* List & Paragraph Styles for Preview */
                .card-preview p { margin-bottom: 1.25rem; font-size: 1rem; color: #334155; line-height: 1.7; }
                .card-preview strong { color: #0f172a; font-weight: 700; }
                .card-preview ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin-bottom: 1.25rem !important; }
                .card-preview ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin-bottom: 1.25rem !important; }
                .card-preview li { font-size: 0.95rem; color: #475569; margin-bottom: 0.4rem; display: list-item !important; }
            ` 
        }} />
    </div>
);
};

export default DocumentEditor;
