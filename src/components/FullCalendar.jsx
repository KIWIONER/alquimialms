import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Brain } from 'lucide-react';

const FullCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Eventos enriquecidos para la vista a pantalla completa
  const events = {
    '2026-04-20': [
        { type: 'exam', title: 'Examen UD04 - Bioquímica', time: '10:00', duration: '90 min', instructor: 'IA Cerebro' },
        { type: 'session', title: 'Revisión Grupal', time: '16:00', duration: '60 min', instructor: 'Dr. Alquimia' }
    ],
    '2026-04-22': [
        { type: 'session', title: 'Tutoría IA Grupal: Microbiota', time: '17:00', duration: '45 min', instructor: 'Gemini Expert' }
    ],
    '2026-04-25': [
        { type: 'deadline', title: 'Entrega Proyecto Dieta Personalizada', time: '23:59', duration: '-', instructor: 'Plataforma' }
    ],
    '2026-05-02': [
        { type: 'exam', title: 'Test Aptitud UD05', time: '09:00', duration: '30 min', instructor: 'IA Cerebro' }
    ]
  };

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    // Ajuste para que lunes sea el primer día (ISO)
    const adjustedStart = startDay === 0 ? 6 : startDay - 1;

    // Días del mes anterior
    for (let i = 0; i < adjustedStart; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[120px] border-b border-r border-slate-100 opacity-30"></div>
      );
    }

    // Días del mes actual
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events[dateStr] || [];
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className={`min-h-[120px] p-2 border-b border-r border-slate-100 transition-all ${isToday ? 'bg-medical-green-50/30' : 'bg-white hover:bg-slate-50/50'}`}>
            <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-bold ${isToday ? 'text-medical-green-600 bg-medical-green-100/50 w-7 h-7 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
                    {day}
                </span>
                {dayEvents.length > 0 && (
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{dayEvents.length} Eventos</span>
                )}
            </div>
            <div className="space-y-1">
                {dayEvents.map((event, idx) => (
                    <div key={idx} className={`p-1.5 rounded-lg border text-[10px] font-bold leading-tight shadow-sm ${
                        event.type === 'exam' ? 'bg-red-50 border-red-100 text-red-700' :
                        event.type === 'session' ? 'bg-medical-green-50 border-medical-green-100 text-medical-green-700' :
                        'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                        <div className="flex items-center gap-1 mb-0.5">
                            <Clock size={10} className="opacity-50" />
                            {event.time}
                        </div>
                        <div className="truncate">{event.title}</div>
                    </div>
                ))}
            </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Superior */}
      <div className="flex items-center justify-between p-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-medical-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-medical-green-500/20">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Calendario <span className="text-medical-green-500 italic">Académico</span></h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Planificación dinámica de Alquimia LMS</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
          <button onClick={handlePrevMonth} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div className="px-6 text-sm font-black text-slate-800 uppercase tracking-widest min-w-[180px] text-center">
            {monthNames[month]} {year}
          </div>
          <button onClick={handleNextMonth} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 transition-all">
            <ChevronRight size={20} />
          </button>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
          <Brain size={14} />
          Optimizar con IA
        </button>
      </div>

      {/* Grid del Calendario */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 border-l border-slate-100">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
            <div key={day} className="py-4 border-b border-r border-slate-100 bg-slate-50/50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
          {renderDays()}
        </div>
      </div>

      {/* Leyenda y Footer */}
      <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-6">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exámenes</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-medical-green-500 ring-4 ring-medical-green-100"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sesiones IA</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entregas</span>
            </div>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: 4 eventos detectados este mes</p>
      </div>
    </div>
  );
};

export default FullCalendar;
