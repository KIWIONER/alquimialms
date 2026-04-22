import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import AIStudyButton from './AIStudyButton';

const FullCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getWeekTitle = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    return `Semana del ${startOfWeek.getDate()} de ${monthNames[startOfWeek.getMonth()]}`;
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Eventos enriquecidos
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
    const adjustedStart = startDay === 0 ? 6 : startDay - 1;

    for (let i = 0; i < adjustedStart; i++) {
      days.push(<div key={`empty-${i}`} className="bg-slate-50/50 min-h-[150px] border-b border-r border-slate-100 opacity-20"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events[dateStr] || [];
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className={`min-h-[150px] p-4 border-b border-r border-slate-100 transition-all ${isToday ? 'bg-medical-green-50/30' : 'bg-white hover:bg-slate-50/50'}`}>
            <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-bold ${isToday ? 'text-medical-green-600 bg-medical-green-100/50 w-8 h-8 flex items-center justify-center rounded-xl' : 'text-slate-400'}`}>
                    {day}
                </span>
            </div>
            <div className="space-y-2">
                {dayEvents.map((event, idx) => (
                    <div key={idx} className={`p-2 rounded-xl border text-[10px] font-bold leading-tight shadow-sm ${
                        event.type === 'exam' ? 'bg-red-50 border-red-100 text-red-700' :
                        event.type === 'session' ? 'bg-medical-green-50 border-medical-green-100 text-medical-green-700' :
                        'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                        <div className="truncate">{event.title}</div>
                        <div className="mt-1 opacity-60 text-[8px] uppercase tracking-widest">{event.time}</div>
                    </div>
                ))}
            </div>
        </div>
      );
    }
    return days;
  };

  const renderWeekView = () => {
    // Cálculo de la semana actual
    const days = [];
    const tempDate = new Date(currentDate);
    const dayOfWeek = tempDate.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek); // Lunes más cercano
    tempDate.setDate(tempDate.getDate() + diff);

    for (let i = 0; i < 7; i++) {
        const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
        const dayEvents = events[dateStr] || [];
        const isToday = new Date().toDateString() === tempDate.toDateString();

        days.push(
            <div key={i} className={`min-h-[500px] p-6 border-r border-slate-100 transition-all flex flex-col ${isToday ? 'bg-medical-green-50/20' : 'bg-white'}`}>
                <div className="text-center mb-8">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                        {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}
                    </span>
                    <span className={`text-2xl font-black ${isToday ? 'text-medical-green-500' : 'text-slate-800'}`}>
                        {tempDate.getDate()}
                    </span>
                </div>
                <div className="flex-1 space-y-4">
                    {dayEvents.length > 0 ? dayEvents.map((event, idx) => (
                        <div key={idx} className={`p-4 rounded-[2rem] border-2 shadow-sm transition-all hover:scale-105 ${
                            event.type === 'exam' ? 'bg-red-50 border-red-100 text-red-700' :
                            event.type === 'session' ? 'bg-medical-green-50 border-medical-green-100 text-medical-green-700' :
                            'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Clock size={12} className="opacity-50" />
                                <span className="text-[10px] uppercase font-black tracking-widest">{event.time}</span>
                            </div>
                            <div className="text-xs font-black leading-tight mb-3">{event.title}</div>
                            <div className="pt-3 border-t border-current/10 text-[9px] font-bold uppercase tracking-wider opacity-60">
                                {event.instructor}
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-50 rounded-[3rem]">
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest rotate-90 whitespace-nowrap">Sin eventos</span>
                        </div>
                    )}
                </div>
            </div>
        );
        tempDate.setDate(tempDate.getDate() + 1);
    }
    return days;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Superior Rediseñado */}
      <div className="grid grid-cols-3 items-center p-8 border-b border-slate-100">
        {/* Lado Izquierdo: Selectores de Vista */}
        <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Mes
                </button>
                <button 
                    onClick={() => setViewMode('week')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Semana
                </button>
            </div>
        </div>

        {/* Centro: Navegación de Fechas (CENTRADO ABSOLUTO) */}
        <div className="flex items-center justify-center">
            <div className="flex items-center bg-slate-900 text-white p-1.5 rounded-[2rem] shadow-xl shadow-slate-900/20">
                <button onClick={handlePrev} className="p-3 hover:bg-white/10 rounded-full transition-all">
                    <ChevronLeft size={20} />
                </button>
                <div className="px-8 text-xs font-black uppercase tracking-[0.2em] min-w-[200px] text-center">
                    {viewMode === 'month' ? `${monthNames[month]} ${year}` : getWeekTitle()}
                </div>
                <button onClick={handleNext} className="p-3 hover:bg-white/10 rounded-full transition-all">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>

        {/* Lado Derecho: Acción IA */}
        <div className="flex justify-end">
            <AIStudyButton />
        </div>
      </div>

      {/* Grid del Calendario Dinámico */}
      <div className="flex-1 overflow-y-auto">
        <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} h-full border-l border-slate-100`}>
          {viewMode === 'month' ? (
              <>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                    <div key={day} className="py-5 border-b border-r border-slate-100 bg-slate-50/50 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
                {renderDays()}
              </>
          ) : (
              renderWeekView()
          )}
        </div>
      </div>

      <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex gap-8">
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-xl bg-red-500 shadow-lg shadow-red-500/20"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exámenes</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-xl bg-medical-green-500 shadow-lg shadow-medical-green-500/20"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sesiones IA</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/20"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entregas</span>
            </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50 underline decoration-medical-green-500 decoration-2 underline-offset-4">Alquimia LMS • Control Académico</p>
      </div>
    </div>
  );
};

export default FullCalendar;
