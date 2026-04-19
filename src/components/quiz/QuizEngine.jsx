import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../../store/quizStore';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import SubjectSelector from './SubjectSelector';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuizEngine = ({ modules }) => {
    const { 
        questions, 
        currentIndex, 
        setQuestions, 
        isSubmitted, 
        submitQuiz, 
        difficulty,
        mode,
        resetQuiz,
        status,
        setStatus,
        selectedTopics
    } = useQuizStore();

    const [error, setError] = useState(null);

    // Cargar preguntas desde n8n
    const fetchQuestions = async () => {
        setStatus('generating');
        setError(null);
        try {
            const webhookUrl = import.meta.env.PUBLIC_N8N_CEREBRO_URL;
            // Payload para que n8n sepa que debe generar un examen, no responder un chat
            const payload = {
                action: "generate_quiz",
                sessionId: "estudiante-demo",
                difficulty: difficulty,
                mode: mode,
                num_questions: 30, // Generar 30 preguntas de los elegidos
                selected_slugs: selectedTopics
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const data = await response.json();
            
            // Suponemos que n8n devuelve el array JSON en data.questions o similar.
            const fetchedQuestions = data.questions || data.items || data;
            
            if (!Array.isArray(fetchedQuestions) || fetchedQuestions.length === 0) {
                throw new Error("Formato de respuesta inválido o sin preguntas.");
            }

            setQuestions(fetchedQuestions);
            setStatus('playing');
        } catch (err) {
            console.error(err);
            setError('Fallo al conectar con el Cerebro de Alquimia o generar el examen.');
            setStatus('setup'); // Vuelve al setup en caso de error
        }
    };

    if (status === 'setup') {
        return <SubjectSelector modules={modules} onGenerate={fetchQuestions} />;
    }

    if (status === 'generating') {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 bg-slate-50">
                <Loader2 className="w-12 h-12 text-medical-green-500 animate-spin" />
                <h2 className="text-xl font-bold text-slate-800">Forjando Evaluación Adaptativa</h2>
                <p className="text-slate-500 font-medium animate-pulse text-center max-w-md">El Cerebro está leyendo los documentos originales y compilando un test de Nivel {difficulty}...</p>
                {error && <p className="text-red-500">{error}</p>}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h3 className="text-lg font-bold text-slate-800">{error}</h3>
                <button onClick={fetchQuestions} className="btn-medical bg-slate-800">Reintentar Conexión</button>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6"
            >
                <div className="w-20 h-20 bg-medical-green-100 rounded-full flex items-center justify-center text-medical-green-600 mb-2">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Evaluación Completada</h2>
                    <p className="text-slate-500 mt-2">Tus resultados han sido enviados al servidor de Alquimia.</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 w-full max-w-sm border border-slate-100">
                   <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-500 font-medium tracking-tight">Puntuación Final:</span>
                        <span className="text-sm font-bold text-medical-green-600">85% (Notable)</span>
                   </div>
                   <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-medical-green-500" style={{ width: '85%' }}></div>
                   </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={resetQuiz} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Reiniciar</button>
                    <a href="/dashboard" className="btn-medical text-xs font-bold">Volver al Dashboard</a>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header de la Evaluación */}
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-20">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setStatus('setup')} 
                        className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1"
                    >
                        ← Volver
                    </button>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unidades Multiselección</span>
                        <span className="text-sm font-bold text-slate-800">{selectedTopics.length} Tópicos Activos</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        mode === 'practice' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {mode === 'practice' ? 'Modo Práctica' : 'Modo Examen'}
                    </span>
                    <button 
                        onClick={() => submitQuiz()}
                        className="btn-medical text-xs bg-slate-900 border-none shadow-slate-200"
                    >
                        Finalizar Examen
                    </button>
                </div>
            </header>

            {/* Barra de Progreso Dinámica */}
            <ProgressBar />

            {/* Contenedor de Preguntas SPA */}
            <main className="flex-1 overflow-y-auto bg-slate-50/30 p-8 flex justify-center">
                <div className="w-full max-w-2xl px-4">
                    <AnimatePresence mode="wait">
                        <QuestionCard key={currentIndex} />
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default QuizEngine;
