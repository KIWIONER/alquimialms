import React from 'react';
import { useQuizStore } from '../../store/quizStore';

const ProgressBar = () => {
    const { questions, answers } = useQuizStore();
    
    if (questions.length === 0) return null;

    const total = questions.length;
    const answered = Object.keys(answers).length;
    const progress = (answered / total) * 100;

    // Colores dinámicos basados en el progreso
    let barColor = 'bg-medical-green-500';
    if (progress < 30) barColor = 'bg-slate-300';
    else if (progress < 70) barColor = 'bg-medical-green-300';

    return (
        <div className="w-full h-1 bg-slate-100 relative shrink-0">
            <div 
                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)] ${barColor}`}
                style={{ width: `${progress}%` }}
            ></div>
            
            {/* Indicador Numérico Flotante */}
            <div 
                className="absolute top-2 px-2 py-1 bg-white border border-slate-100 rounded-md shadow-sm text-[9px] font-bold text-slate-500 transition-all duration-1000 transform -translate-x-1/2"
                style={{ left: `${progress}%` }}
            >
                {answered} / {total}
            </div>
        </div>
    );
};

export default ProgressBar;
