import React from 'react';
import { useQuizStore } from '../../store/quizStore';

const DifficultySelector = () => {
    const { difficulty, setDifficulty, questions, isSubmitted } = useQuizStore();

    if (isSubmitted && questions.length > 0) return null;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dificultad del Cerebro</span>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all duration-300 ${
                            difficulty === level 
                                ? 'bg-medical-green-500 text-white shadow-md shadow-medical-green-500/20 scale-110' 
                                : 'text-slate-400 hover:bg-white hover:text-slate-600'
                        }`}
                    >
                        {level}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DifficultySelector;
