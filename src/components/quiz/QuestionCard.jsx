import React, { useState } from 'react';
import { useQuizStore } from '../../store/quizStore';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

const QuestionCard = () => {
    const { 
        questions, 
        currentIndex, 
        answers, 
        setAnswer, 
        nextQuestion, 
        prevQuestion,
        mode,
        isSubmitted
    } = useQuizStore();

    const currentQuestion = questions[currentIndex];
    const userAnswer = answers[currentQuestion?.id];
    const [showRationale, setShowRationale] = useState(false);

    if (!currentQuestion) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-medical-green-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium animate-pulse">Cargando evaluación dinámica...</p>
        </div>
    );

    const handleOptionSelect = (index) => {
        if (isSubmitted) return;
        setAnswer(currentQuestion.id, index);
        if (mode === 'practice') {
            setShowRationale(true);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col space-y-6"
        >
            {/* Pregunta */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-medical-green-500"></div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-medical-green-600 bg-medical-green-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Pregunta {currentIndex + 1}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                    {currentQuestion.text}
                </h2>
            </div>

            {/* Opciones */}
            <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option, index) => {
                    const isSelected = userAnswer === index;
                    const isCorrect = index === currentQuestion.correctAnswer;
                    const showFeedback = (mode === 'practice' && userAnswer !== undefined) || isSubmitted;

                    let statusClass = 'border-slate-100 bg-white hover:border-medical-green-200';
                    if (showFeedback) {
                        if (isCorrect) statusClass = 'border-medical-green-500 bg-medical-green-50 text-medical-green-800 ring-1 ring-medical-green-500/20';
                        else if (isSelected) statusClass = 'border-red-400 bg-red-50 text-red-800 ring-1 ring-red-500/10';
                    } else if (isSelected) {
                        statusClass = 'border-medical-green-500 bg-medical-green-50 text-medical-green-900 ring-1 ring-medical-green-500/20';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            className={`flex items-center p-4 rounded-xl border-2 text-left transition-all duration-300 group ${statusClass}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-4 font-bold text-xs transition-colors ${
                                isSelected ? 'bg-medical-green-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-medical-green-100'
                            }`}>
                                {String.fromCharCode(65 + index)}
                            </div>
                            <span className="text-sm font-semibold">{option}</span>
                        </button>
                    );
                })}
            </div>

            {/* Feedback: Rationale & Hint (Practice Mode) */}
            <AnimatePresence>
                {showRationale && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-medical-green-50/50 border border-medical-green-100 rounded-2xl p-5 overflow-hidden"
                    >
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-medical-green-100 flex items-center justify-center text-medical-green-600 shrink-0">
                                <Lightbulb className="w-5 h-5" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold text-medical-green-800 uppercase tracking-widest mb-1">Pista</h4>
                                    <p className="text-sm text-medical-green-700 leading-relaxed italic">{currentQuestion.hint}</p>
                                </div>
                                <div className="pt-2 border-t border-medical-green-100/50">
                                    <h4 className="text-xs font-bold text-medical-green-800 uppercase tracking-widest mb-1">Explicación Clínica</h4>
                                    <p className="text-sm text-medical-green-900 leading-relaxed">{currentQuestion.rationale}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navegación Inferior */}
            <div className="flex items-center justify-between pt-4 pb-12">
                <button 
                    onClick={prevQuestion}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Anterior</span>
                </button>

                <div className="flex items-center gap-1.5">
                    {questions.slice(0, 5).map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === currentIndex ? 'w-6 bg-medical-green-500' : 'w-1.5 bg-slate-200'
                        }`}></div>
                    ))}
                    <span className="text-[10px] font-bold text-slate-300 ml-2">...</span>
                </div>

                <button 
                    onClick={nextQuestion}
                    disabled={currentIndex === questions.length - 1}
                    className="flex items-center gap-1 text-medical-green-600 hover:text-medical-green-700 disabled:opacity-30 disabled:pointer-events-none transition-colors font-bold"
                >
                    <span className="text-xs font-bold uppercase tracking-widest">Siguiente</span>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
};

export default QuestionCard;
