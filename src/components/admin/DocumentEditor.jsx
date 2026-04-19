import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { supabase } from '../../lib/supabase';
import RichCardEditor from './RichCardEditor';
import { toKebabCase } from '../../lib/content';
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

const SortableIndexItem = ({ id, index, titulo, onSelect, isActive }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, position: 'relative', zIndex: 10 };
    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            <button onClick={onSelect} className={`w-full text-left py-2.5 px-4 rounded-xl flex items-start gap-4 transition-all border-2 ${isActive ? 'bg-medical-green-500 text-white border-medical-green-500 shadow-lg' : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200 hover:shadow-sm'}`}>
                <span className={`flex-shrink-0 text-[10px] font-black w-6 h-6 rounded-lg flex items-center justify-center border mt-0.5 ${isActive ? 'bg-medical-green-600 border-medical-green-400' : 'bg-slate-50 border-slate-100'}`}>{index + 1}</span>
                <span className="text-[13px] font-bold leading-tight whitespace-normal break-words flex-1 tracking-tight">{titulo || 'Sin título'}</span>
                <div {...attributes} {...listeners} className={`p-1 cursor-grab active:cursor-grabbing transition-colors ${isActive ? 'text-medical-green-200 hover:text-white' : 'text-slate-300 hover:text-slate-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" /></svg>
                </div>
            </button>
        </div>
    );
};

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
    const [docOrderMaps, setDocOrderMaps] = useState(() => { if (typeof window !== 'undefined') { const saved = localStorage.getItem('alquimia_docs_order'); return saved ? JSON.parse(saved) : {}; } return {}; });
    
    const activeEditorRef = useRef(null);
    const cardsScrollRef = useRef(null);
    const cardRefs = useRef({});
    const autosaveTimers = useRef({});

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        try { const { data, error } = await supabase.schema('nutricionista').from('documentos').select('id, nombre, carpeta').order('nombre'); if (error) throw error; setDocuments(data.filter(d => d.nombre !== '.emptyFolderPlaceholder')); } 
        catch (err) { console.error('Error DB:', err); } 
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
                await supabase.schema('nutricionista').from('tarjetas').update({ titulo: fields.titulo || undefined, contenido: fields.contenido || undefined, updated_at: new Date().toISOString() }).eq('id', id);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } catch { setSaveStatus('idle'); }
        }, 1200);
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

    return (
        <div className="flex h-screen w-screen bg-[#fcfcfc] overflow-hidden text-slate-900">
            {/* PANEL 1: NAV */}
            <div className={`w-[380px] h-full bg-white border-r border-slate-100 flex flex-col shrink-0 transition-all duration-500 z-50 ${sidebarOpen ? '' : '-ml-[380px]'}`}>
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
                        <h3 className="text-[13px] font-black uppercase tracking-tight">{selectedDoc.nombre}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-2">
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
                                {tarjetas.map((t, i) => <SortableIndexItem key={t.id} id={t.id} index={i} titulo={t.titulo} isActive={selectedCardId === t.id} onSelect={() => setSelectedCardId(t.id)} />)}
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            )}

            {/* PANEL 3: EDITOR */}
            <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#fdfcfb]">
                {/* TOOLBAR FIJO */}
                <div className="h-24 px-12 border-b border-slate-100 flex items-center bg-white z-[100] shrink-0 shadow-sm gap-8">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                        <svg className={`h-6 w-6 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M11 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex-1 flex items-center gap-4">
                        <div className="flex gap-1.5 grayscale-[0.2]">
                             <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().toggleBold().run(); }} className="w-9 h-9 rounded-lg hover:bg-slate-100 border border-transparent font-bold">B</button>
                             <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().toggleHeading({ level: 3 }).run(); }} className="w-9 h-9 rounded-lg hover:bg-slate-100 border border-transparent font-black text-xs">H3</button>
                             <button onMouseDown={e => { e.preventDefault(); activeEditorRef.current?.chain().focus().insertTable({ rows: 2, cols: 3 }).run(); }} className="w-9 h-9 rounded-lg hover:bg-slate-100 border border-transparent flex items-center justify-center"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 10h18M3 14h18m-9-4v8" strokeWidth="2" /></svg></button>
                        </div>
                        <div className="ml-auto flex items-center gap-6">
                            <button onClick={handleManualSave} className="bg-medical-green-600 text-white px-8 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-medical-green-700 shadow-md active:scale-95 transition-all">GUARDAR TODO</button>
                            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                <span className={`w-3 h-3 rounded-full ${saveStatus === 'saving' ? 'bg-orange-500 animate-pulse' : saveStatus === 'saved' ? 'bg-medical-green-500' : 'bg-slate-200'}`} />
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Cloud Sync</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SCROLL DE TARJETAS */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    {selectedDoc ? (
                        <div className="max-w-4xl mx-auto space-y-16 pb-96">
                            {tarjetas.map((t, i) => (
                                <div key={t.id} className={`bg-white rounded-[3rem] border-2 transition-all p-12 ${selectedCardId === t.id ? 'border-medical-green-500 shadow-2xl' : 'border-slate-50 shadow-sm'}`} onClick={() => setSelectedCardId(t.id)}>
                                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
                                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">{i+1}</div>
                                        <input value={t.titulo || ''} onChange={e => updateLocalTarjeta(t.id, { titulo: e.target.value })} className="flex-1 bg-transparent border-none focus:outline-none font-black text-xl text-slate-800" placeholder="Título del tema..." />
                                        <button onClick={() => setPreviewModes(p => ({ ...p, [t.id]: !p[t.id] }))} className="text-[10px] font-black bg-slate-50 px-6 py-2 rounded-xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all uppercase tracking-widest">{previewModes[t.id] ? 'Editor' : 'Preview'}</button>
                                    </div>
                                    <div className="select-text min-h-[300px]">
                                        {previewModes[t.id] ? (
                                            <div className="prose prose-slate max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>{t.contenido}</ReactMarkdown></div>
                                        ) : (
                                            <RichCardEditor content={t.contenido} onChange={val => updateLocalTarjeta(t.id, { contenido: val })} onFocus={ed => { activeEditorRef.current = ed; setActiveEditorState(ed); setSelectedCardId(t.id); }} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                            <div className="text-9xl mb-8">🏺</div>
                            <span className="text-2xl font-black uppercase tracking-[1em]">Alquimia LMS</span>
                        </div>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }` }} />
        </div>
    );
};

export default DocumentEditor;
