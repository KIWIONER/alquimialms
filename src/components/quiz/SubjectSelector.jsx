import React from 'react';
import { useQuizStore } from '../../store/quizStore';
import DifficultySelector from './DifficultySelector';
import { BookOpen, Check } from 'lucide-react';

const SubjectSelector = ({ modules, onGenerate }) => {
    const { selectedTopics, toggleTopic, difficulty, mode, setMode } = useQuizStore();

    return (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Configuración de Evaluación</h1>
                    <p className="text-slate-500 mt-2">Selecciona las unidades didácticas que deseas repasar. El "Cerebro" leerá los documentos originales y generará un examen adaptado a tu selección.</p>
                </header>

                {/* Controles Globales */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-8 items-center justify-between">
                    <div className="flex gap-8">
                        <DifficultySelector />
                        <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modo de Evaluación</span>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button 
                                    onClick={() => setMode('practice')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'practice' ? 'bg-white shadow-sm text-medical-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Práctica
                                </button>
                                <button 
                                    onClick={() => setMode('exam')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'exam' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Simulacro
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onGenerate}
                        disabled={selectedTopics.length === 0}
                        className={`btn-medical px-8 py-3 shrink-0 ${selectedTopics.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Generar Test IA (30 Preguntas)
                    </button>
                </div>

                {/* Grid de Asignaturas */}
                <div className="space-y-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Currículo Disponible</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {modules.map((mod) => (
                            <div key={mod.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                                    <BookOpen className="w-4 h-4 text-slate-400" />
                                    <h3 className="font-bold text-slate-700 text-sm">{mod.name}</h3>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {mod.units.map((unit) => {
                                        const uniqueId = `${mod.id}/${unit.slug}`;
                                        const isSelected = selectedTopics.includes(uniqueId);
                                        return (
                                            <label 
                                                key={uniqueId}
                                                className={`flex items-start gap-3 p-3 cursor-pointer transition-colors group ${isSelected ? 'bg-medical-green-50/30' : 'hover:bg-slate-50'}`}
                                            >
                                                <div className="pt-0.5">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-medical-green-500 border-medical-green-500' : 'border-slate-300 bg-white group-hover:border-medical-green-400'}`}>
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only"
                                                    checked={isSelected}
                                                    onChange={() => toggleTopic(uniqueId)}
                                                />
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium transition-colors line-clamp-1 ${isSelected ? 'text-medical-green-900' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                        {unit.nombre.replace(/\.(pdf|docx)$/i, '')}
                                                    </p>
                                                    {unit.completado && (
                                                        <span className="text-[10px] text-medical-green-600 font-bold uppercase tracking-wider">Leído</span>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubjectSelector;
