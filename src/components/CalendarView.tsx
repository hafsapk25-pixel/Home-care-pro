import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  FileText,
  Wrench,
  ShoppingCart,
  Bell,
} from 'lucide-react';
import { FullHouseholdDatabase, HouseholdReminder } from '../types';
import { formatDate } from '../utils/formatters';

interface CalendarViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ database, onUpdateDatabase }) => {
  const easy = database.settings.easyWording;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00 AM',
    priority: 'medium' as HouseholdReminder['priority'],
    type: 'custom' as HouseholdReminder['type'],
    notes: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handleToggleComplete = (id: string) => {
    const updated = database.reminders.map((r) =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    onUpdateDatabase({ ...database, reminders: updated });
  };

  const handleDeleteReminder = (id: string) => {
    const updated = database.reminders.filter((r) => r.id !== id);
    onUpdateDatabase({ ...database, reminders: updated });
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const newReminder: HouseholdReminder = {
      id: `rem_${Date.now()}`,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      priority: formData.priority,
      type: formData.type,
      completed: false,
      notes: formData.notes,
    };

    onUpdateDatabase({ ...database, reminders: [...database.reminders, newReminder] });
    setIsModalOpen(false);
  };

  // Collect all events on dates (Bills, Maintenance, Reminders)
  const getEventsForDate = (dateStr: string) => {
    const billEvents = database.monthlyBills
      .filter((b) => b.dueDate === dateStr)
      .map((b) => ({
        id: b.id,
        title: `Bill Due: ${b.name}`,
        type: 'bill' as const,
        status: b.status,
      }));

    const maintEvents = database.maintenanceTasks
      .filter((m) => m.scheduledDate === dateStr)
      .map((m) => ({
        id: m.id,
        title: `Maintenance: ${m.title}`,
        type: 'maintenance' as const,
        status: m.status,
      }));

    const reminderEvents = database.reminders
      .filter((r) => r.date === dateStr)
      .map((r) => ({
        id: r.id,
        title: r.title,
        type: 'reminder' as const,
        status: r.completed ? 'completed' : 'pending',
      }));

    return [...billEvents, ...maintEvents, ...reminderEvents];
  };

  const selectedDateEvents = getEventsForDate(selectedDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            {easy ? 'Household Calendar & Yaad-Dehani' : 'Household Calendar & Deadlines'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Bill ki aakhri tareekh, rashan lene ka din, aur ghar ke zaroori kaam'
              : 'Unified schedule of utility bill due dates, maintenance visits, and custom household alerts'}
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              date: selectedDay,
              time: '10:00 AM',
              priority: 'medium',
              type: 'custom',
              notes: '',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Reminder</span>
        </button>
      </div>

      {/* Main Grid: Calendar on Left, Selected Date Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty pads */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty_${idx}`} className="h-20 rounded-xl bg-slate-50/40 dark:bg-slate-900/20" />
            ))}

            {/* Actual Days */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const events = getEventsForDate(dateStr);
              const isSelected = selectedDay === dateStr;
              const isToday = new Date().toISOString().slice(0, 10) === dateStr;

              return (
                <div
                  key={`day_${dayNum}`}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`h-20 p-1.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 font-bold'
                      : isToday
                      ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] ${
                        isToday
                          ? 'bg-teal-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {events.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {events.slice(0, 2).map((ev, i) => (
                      <div
                        key={i}
                        className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                          ev.type === 'bill'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : ev.type === 'maintenance'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <span className="text-[8px] text-slate-400 block">
                        +{events.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel (1 col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600">
                SCHEDULED EVENTS & REMINDERS
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {formatDate(selectedDay)}
              </h4>
            </div>

            <div className="mt-4 space-y-3">
              {selectedDateEvents.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No bills or reminders scheduled for this date.
                </p>
              ) : (
                selectedDateEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {ev.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {ev.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Status: {ev.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setFormData({ ...formData, date: selectedDay });
              setIsModalOpen(true);
            }}
            className="w-full py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/40 rounded-xl hover:bg-teal-100 transition-colors"
          >
            + Add Reminder for {selectedDay}
          </button>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                Add Household Reminder
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pay Internet Bill / Buy Atta"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as any })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reminder Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="bill">Utility Bill</option>
                    <option value="grocery">Grocery Refill</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="event">Family Event</option>
                    <option value="custom">General Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Additional context or account number"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
