import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
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

  // Simulación de eventos académicos (Alquimia LMS)
  const events = {
    '2026-04-20': { type: 'exam', title: 'Examen UD04 - Bioquímica' },
    '2026-04-22': { type: 'session', title: 'Tutoría IA Grupal' },
    '2026-04-25': { type: 'deadline', title: 'Entrega Proyecto Dieta' }
  };

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Días vacíos del mes anterior
    for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    // Días del mes
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const event = events[dateStr];
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className="relative h-10 w-10 flex items-center justify-center">
            {isToday && <div className="absolute inset-1 bg-medical-green-50 rounded-full border border-medical-green-100"></div>}
            <span className={`text-xs font-medium z-10 ${isToday ? 'text-medical-green-700 font-bold' : 'text-slate-600'}`}>{day}</span>
            {event && (
              <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full z-20 ${
                event.type === 'exam' ? 'bg-red-500' : event.type === 'session' ? 'bg-medical-green-500' : 'bg-amber-500'
              }`}></div>
            )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Calendario Académico</h3>
        <div class="flex gap-1">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div class="text-sm font-bold text-slate-800 mb-3 px-1">
        {monthNames[month]} {year}
      </div>

      <div class="grid grid-cols-7 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-300 text-center uppercase">{day}</div>
        ))}
      </div>

      <div class="grid grid-cols-7 gap-y-1">
        {renderDays()}
      </div>

      <div class="mt-4 pt-4 border-t border-slate-50 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>Examen Crítico</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
          <div className="w-2 h-2 rounded-full bg-medical-green-500"></div>
          <span>Refuerzo IA</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
