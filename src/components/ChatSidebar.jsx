import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/tracking';
import { useChatStore } from '../store/chatStore';
import ReactMarkdown from 'react-markdown';

const ChatSidebar = ({ unitName, moduleName, unitSlug }) => {
    const { messages, loading, addMessage, setLoading, initChatIfNeeded } = useChatStore();
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

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        addMessage(userMessage);
        
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            const webhookUrl = import.meta.env.PUBLIC_N8N_CEREBRO_URL;
            
            const currentPath = window.location.pathname;
            
            // Función de normalización kebab-case por si hay espacios o caracteres raros en la URL
            const toKebabCase = (str) => {
                return str
                    .normalize('NFD') // Quitar tildes
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-/]/g, '-') // Permitimos '/' para mantener la estructura carpeta/archivo
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            };

            // Extraemos todo lo que va después de /leccion/ para que quede carpeta/slug
            const match = currentPath.match(/^\/leccion\/(.*)/);
            let raw_slug = match ? match[1] : '';
            // Si no estamos en /leccion, usa el unitName o dejamos vacio
            if (!raw_slug && unitName) {
                raw_slug = unitName.replace(/\.(pdf|PDF|docx|DOCX)$/, '');
            }

            const current_slug = toKebabCase(raw_slug);
            const current_carpeta = current_slug.split('/')[0] || "";

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatInput: currentInput,
                    sessionId: 'estudiante-demo',
                    current_slug: current_slug,
                    current_carpeta: current_carpeta
                }),
            });

            if (!response.ok) throw new Error('Cerebro no responde');

            const data = await response.json();
            
            // Suponemos que n8n devuelve { output: "..." } o { response: "..." }
            let aiText = data.output || data.response || data.text || "Lo siento, he tenido un problema procesando tu duda.";

            addMessage({ 
                role: 'assistant', 
                content: aiText 
            });
        } catch (err) {
            console.error('AI Agent Error:', err);
            addMessage({ 
                role: 'assistant', 
                content: '⚠️ Lo siento, mi conexión con el servidor central de Alquimia se ha interrumpido. Por favor, inténtalo de nuevo en unos momentos.' 
            });
        } finally {
            setLoading(false);
        }
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
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-2xl p-4 text-sm shadow-sm transition-all overflow-x-auto ${
                            msg.role === 'user' 
                                ? 'bg-medical-green-500 text-white rounded-tr-none' 
                                : `rounded-tl-none border ${msg.isProactive ? 'bg-medical-green-50 border-medical-green-200 text-medical-green-900 font-medium' : 'bg-slate-50 text-slate-700 border-slate-200'}`
                        }`}>
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <div className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-a:text-medical-green-600 hover:prose-a:text-medical-green-700 prose-strong:text-slate-800 [&_table]:w-full [&_table]:border-collapse [&_th]:border-b-2 [&_th]:border-slate-200 [&_th]:py-2 [&_th]:text-left [&_td]:border-b [&_td]:border-slate-100 [&_td]:py-2 [&_tr:last-child_td]:border-b-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2">
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
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
