import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/tracking';
import { useChatStore } from '../store/chatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

const ChatSidebar = ({ unitName, moduleName, unitSlug }) => {
    const { messages, loading, sendMessage, initChatIfNeeded } = useChatStore();
    const [input, setInput] = useState('');
    const [isAlerting, setIsAlerting] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        initChatIfNeeded({ 
            role: 'assistant', 
            content: `Hola. Soy Cerebro, tu tutor inteligente de Alquimia. Te acompaño durante toda tu navegación, listo para resolver dudas en cualquier tema.` 
        });
    }, [initChatIfNeeded]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Subscribirse a notificaciones de fallo (Trigger Proactivo)
    useEffect(() => {
        const channel = supabase
            .channel('lms-triggers')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'lms_notifications', filter: 'type=eq.fail_trigger' },
                (payload) => {
                    console.log('🚨 Trigger detectado:', payload.new);
                    handleProactiveSupport(payload.new.unit_id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleProactiveSupport = (unitId) => {
        setIsAlerting(true);
        addMessage({ 
            role: 'assistant', 
            content: `He notado que la evaluación de la ${unitId} está siendo un desafío. ¡No te preocupes! La nutrición clínica requiere tiempo. ¿Quieres que revisemos los conceptos clave de este apartado juntos?`,
            isProactive: true
        });
        
        // El pulso dura unos segundos para llamar la atención sin molestar
        setTimeout(() => setIsAlerting(false), 5000);
    };

    const extractOptions = (text) => {
        if (!text) return [];
        const lines = text.split('\n');
        const options = [];
        const optionRegex = /^([a-d])\)\s*(.*)/i;
        
        lines.forEach(line => {
            const match = line.trim().match(optionRegex);
            if (match) {
                options.push({
                    id: match[1].toLowerCase(),
                    text: match[2].trim(),
                    full: line.trim()
                });
            }
        });
        return options;
    };

    const handleOptionSelect = (option) => {
        if (loading) return;
        // Enviamos la respuesta de forma natural
        const responseText = `Mi respuesta es la ${option.id}: ${option.text}`;
        handleSend(null, responseText);
    };

    const handleSend = async (e, forcedInput = null) => {
        if (e) e.preventDefault();
        const finalInput = forcedInput || input;
        
        if (!finalInput.trim() || loading) return;

        if (!forcedInput) setInput('');

        // Calculamos el contexto
        const currentPath = window.location.pathname;
        const toKebabCase = (str) => {
            return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-/]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        };

        const match = currentPath.match(/^\/leccion\/(.*)/);
        let raw_slug = match ? match[1] : '';
        if (!raw_slug && unitName) {
            raw_slug = unitName.replace(/\.(pdf|PDF|docx|DOCX)$/, '');
        }

        const current_slug = toKebabCase(raw_slug);
        const current_carpeta = current_slug.split('/')[0] || "";

        // Llamamos a la acción centralizada
        await sendMessage(finalInput, {
            current_slug,
            current_carpeta
        });
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header del Tutor */}
            <div className={`h-14 border-b flex items-center px-4 justify-between transition-colors duration-500 ${isAlerting ? 'bg-medical-green-100 border-medical-green-300' : 'bg-medical-green-50/50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden ${isAlerting ? 'ring-4 ring-medical-green-400 animate-pulse' : ''}`}>
                             {/* Avatar de Alquimia (Ya generado) */}
                             <div className="w-full h-full bg-medical-green-500 flex items-center justify-center text-white font-bold text-xs">P</div>
                        </div>
                        {isAlerting && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></div>}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xs text-medical-green-900 tracking-tight">Agente Alquimia</span>
                        <span className="text-[10px] text-medical-green-600 font-medium">Conectado • Gemini 2.5</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => {
                    if (msg.role === 'system_info') {
                        return (
                            <div key={i} className="flex justify-center p-4 animate-in fade-in zoom-in duration-500">
                                <div className="bg-medical-green-50 border border-medical-green-200/50 rounded-2xl px-6 py-4 flex flex-col items-center gap-3 shadow-sm max-w-[80%]">
                                    <div className="w-8 h-8 border-3 border-medical-green-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-medical-green-700 text-center">{msg.content}</span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] rounded-2xl p-4 text-sm shadow-sm transition-all overflow-x-auto ${
                                msg.role === 'user' 
                                    ? 'bg-medical-green-500 text-white rounded-tr-none' 
                                    : `rounded-tl-none border ${msg.isProactive ? 'bg-medical-green-50 border-medical-green-200 text-medical-green-900 font-medium' : 'bg-slate-50 text-slate-700 border-slate-200'}`
                            }`}>
                                {msg.role === 'user' ? (
                                    msg.content
                                ) : (
                                    (()=>{
                                        const options = extractOptions(msg.content);
                                        const isInteractive = msg.role === 'assistant' && i === messages.length - 1 && !loading && options.length > 0;
                                        
                                        // Limpiamos el contenido si hay botones interactivos para no duplicar información
                                        let displayContent = msg.content;
                                        if (isInteractive) {
                                            displayContent = msg.content.split('\n')
                                                .filter(line => !line.trim().match(/^([a-d])\)\s*(.*)/i))
                                                .join('\n');
                                        }

                                        return (
                                            <>
                                                <div className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-a:text-medical-green-600 hover:prose-a:text-medical-green-700 prose-strong:text-slate-800 [&_table]:w-full [&_table]:border-collapse [&_th]:border-b-2 [&_th]:border-slate-200 [&_th]:py-2 [&_th]:text-left [&_td]:border-b [&_td]:border-slate-100 [&_td]:py-2 [&_tr:last-child_td]:border-b-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm, remarkBreaks]}
                                                        rehypePlugins={[rehypeRaw]}
                                                    >
                                                        {displayContent}
                                                    </ReactMarkdown>
                                                </div>
                                                
                                                {/* BOTONES INTERACTIVOS */}
                                                {isInteractive && (
                                                    <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                        {options.map((opt) => (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => handleOptionSelect(opt)}
                                                                className="w-full text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-medical-green-500 hover:bg-medical-green-50 text-slate-700 hover:text-medical-green-900 transition-all text-xs font-medium shadow-sm group flex gap-3 items-center"
                                                            >
                                                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-medical-green-500 group-hover:text-white transition-colors uppercase">{opt.id}</span>
                                                                <span className="flex-1 leading-tight">{opt.text}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()
                                )}
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 rounded-tl-none flex gap-1">
                            <div className="w-1.5 h-1.5 bg-medical-green-300 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-medical-green-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-medical-green-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleSend} className="relative">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Preguntar al Tutor IA..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-medical-green-500/20 focus:border-medical-green-500 transition-all"
                    />
                    <button 
                        type="submit"
                        className="absolute right-2 top-1.5 p-1.5 text-medical-green-600 hover:bg-medical-green-50 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatSidebar;
