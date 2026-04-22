import React from 'react';
import { LayoutGrid, Layers, Clock, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react';
import AIStudyButton from './AIStudyButton';

const GanttTimeline = () => {
  const units = [
    { 
        id: 'UD01', 
        name: 'Nutrición Humana y Dietética', 
        start: 0, 
        duration: 15, 
        progress: 100,
        status: 'completed',
        color: 'bg-medical-green-500'
    },
    { 
        id: 'UD02', 
        name: 'Bioquímica de los Alimentos', 
        start: 12, 
        duration: 20, 
        progress: 85,
        status: 'in-progress',
        color: 'bg-medical-green-400'
    },
    { 
        id: 'UD03', 
        name: 'Microbiología Alimentaria', 
        start: 30, 
        duration: 18, 
        progress: 0,
        status: 'pending',
        color: 'bg-slate-300'
    },
    { 
        id: 'UD04', 
        name: 'Dietoterapia y Patologías', 
        start: 45, 
        duration: 25, 
        progress: 0,
        status: 'pending',
        color: 'bg-slate-300'
    }
  ];

  const weeks = Array.from({ length: 12 }, (_, i) => `Semana ${i + 1}`);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-8 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <TrendingUp size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Planificación <span className="text-medical-green-500 italic">Gantt</span></h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Cronograma de estudios y metas de aprendizaje</p>
            </div>
        </div>

        <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Progreso Total</span>
                <span className="text-sm font-black text-medical-green-600">42%</span>
            </div>
            <AIStudyButton />
        </div>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 overflow-hidden flex flex-col p-8">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden">
            {/* Timeline Header (Weeks) */}
            <div className="flex border-b border-slate-50 bg-slate-50/50">
                <div className="w-80 p-4 border-r border-slate-100 shrink-0 text-[10px] font-black uppercase text-slate-400 tracking-widest">Módulos / Unidades</div>
                <div className="flex-1 flex overflow-x-auto overflow-hidden custom-scrollbar">
                    {weeks.map(week => (
                        <div key={week} className="flex-1 min-w-[100px] p-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-r border-slate-50 last:border-0 italic">
                            {week}
                        </div>
                    ))}
                </div>
            </div>

            {/* List and Tracks */}
            <div className="flex-1 overflow-y-auto">
                {units.map((unit) => (
                    <div key={unit.id} className="flex border-b border-slate-50 last:border-0 group hover:bg-slate-50/30 transition-colors">
                        {/* Unit Label */}
                        <div className="w-80 p-6 border-r border-slate-100 shrink-0 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${unit.color} text-white flex items-center justify-center font-black text-xs shadow-md`}>
                                {unit.id}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-black text-slate-800 uppercase tracking-wide truncate">{unit.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-medical-green-500 rounded-full" style={{ width: `${unit.progress}%` }}></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400">{unit.progress}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Track */}
                        <div className="flex-1 flex relative items-center py-8">
                             {/* Grid Lines Overlay */}
                            <div className="absolute inset-0 flex">
                                {weeks.map((_, i) => (
                                    <div key={i} className="flex-1 border-r border-slate-50 last:border-0"></div>
                                ))}
                            </div>

                            {/* Gantt Bar */}
                            <div 
                                className={`absolute h-10 rounded-2xl ${unit.color} shadow-lg shadow-current/10 flex items-center px-4 transition-all hover:scale-[1.02] cursor-pointer group-hover:brightness-105`}
                                style={{ 
                                    left: `${(unit.start / 84) * 100}%`, // 84 days approx for 12 weeks
                                    width: `${(unit.duration / 84) * 100}%` 
                                }}
                            >
                                {unit.progress > 0 && (
                                    <div className="absolute inset-0 bg-black/10 rounded-2xl overflow-hidden">
                                         <div className="h-full bg-white/30 backdrop-blur-sm" style={{ width: `${unit.progress}%` }}></div>
                                    </div>
                                )}
                                <div className="relative z-10 flex items-center justify-between w-full">
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest truncate">{unit.duration} Días</span>
                                    {unit.status === 'completed' && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-medical-green-50 text-medical-green-600 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completadas</span>
                    <h3 className="text-lg font-black text-slate-800">1 / 4</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                </div>
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga Semanal</span>
                    <h3 className="text-lg font-black text-slate-800">12 Horas</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                    <Layers size={24} />
                </div>
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exámenes</span>
                    <h3 className="text-lg font-black text-slate-800">3 Pendientes</h3>
                </div>
            </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <LayoutGrid size={24} />
                </div>
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregas</span>
                    <h3 className="text-lg font-black text-slate-800">2 Próximas</h3>
                </div>
            </div>
        </div>
      </div>

       <style dangerouslySetInnerHTML={{ 
            __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 1px; } 
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; }
            ` 
        }} />
    </div>
  );
};

export default GanttTimeline;
