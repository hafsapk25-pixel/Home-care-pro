import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  X,
  Search,
  User,
  ShieldAlert,
} from 'lucide-react';
import { FullHouseholdDatabase, MaintenanceTask, Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface MaintenanceViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'AC Maintenance' as MaintenanceTask['category'],
    status: 'scheduled' as MaintenanceTask['status'],
    scheduledDate: new Date().toISOString().slice(0, 10),
    completedDate: '',
    serviceProvider: '',
    providerPhone: '',
    cost: '',
    nextMaintenanceDate: '',
    notes: '',
  });

  const categories = [
    'Plumbing',
    'Electrical',
    'Painting',
    'Furniture Repair',
    'AC Maintenance',
    'Deep Cleaning',
    'Appliance Repair',
    'Carpentry',
    'Roof & Water Tank',
    'Other',
  ];

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      category: 'AC Maintenance',
      status: 'scheduled',
      scheduledDate: new Date().toISOString().slice(0, 10),
      completedDate: '',
      serviceProvider: '',
      providerPhone: '',
      cost: '',
      nextMaintenanceDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: MaintenanceTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      category: task.category,
      status: task.status,
      scheduledDate: task.scheduledDate,
      completedDate: task.completedDate || '',
      serviceProvider: task.serviceProvider,
      providerPhone: task.providerPhone || '',
      cost: task.cost.toString(),
      nextMaintenanceDate: task.nextMaintenanceDate || '',
      notes: task.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      const updated = database.maintenanceTasks.filter((t) => t.id !== id);
      onUpdateDatabase({ ...database, maintenanceTasks: updated });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = parseFloat(formData.cost) || 0;

    if (!formData.title) {
      alert('Please enter maintenance title');
      return;
    }

    if (editingTask) {
      const updated = database.maintenanceTasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: formData.title,
              category: formData.category,
              status: formData.status,
              scheduledDate: formData.scheduledDate,
              completedDate: formData.completedDate,
              serviceProvider: formData.serviceProvider,
              providerPhone: formData.providerPhone,
              cost: costNum,
              nextMaintenanceDate: formData.nextMaintenanceDate,
              notes: formData.notes,
            }
          : t
      );
      onUpdateDatabase({ ...database, maintenanceTasks: updated });
    } else {
      const newTask: MaintenanceTask = {
        id: `maint_${Date.now()}`,
        title: formData.title,
        category: formData.category,
        status: formData.status,
        scheduledDate: formData.scheduledDate,
        completedDate: formData.completedDate,
        serviceProvider: formData.serviceProvider,
        providerPhone: formData.providerPhone,
        cost: costNum,
        nextMaintenanceDate: formData.nextMaintenanceDate,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      };

      // If status is completed and cost > 0, auto-record expense!
      const newExpense: Expense | null =
        formData.status === 'completed' && costNum > 0
          ? {
              id: `exp_maint_${Date.now()}`,
              date: formData.completedDate || formData.scheduledDate,
              amount: costNum,
              category: 'House Maintenance',
              description: `Maintenance: ${formData.title} (${formData.serviceProvider})`,
              paymentMethod: 'Cash',
              paidTo: formData.serviceProvider,
              createdAt: new Date().toISOString(),
            }
          : null;

      onUpdateDatabase({
        ...database,
        maintenanceTasks: [newTask, ...database.maintenanceTasks],
        expenses: newExpense ? [newExpense, ...database.expenses] : database.expenses,
      });
    }
    setIsModalOpen(false);
  };

  const markCompleted = (task: MaintenanceTask) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = database.maintenanceTasks.map((t) =>
      t.id === task.id ? { ...t, status: 'completed' as const, completedDate: today } : t
    );

    // If cost > 0, also log in expenses
    const newExpense: Expense | null =
      task.cost > 0
        ? {
            id: `exp_maint_${Date.now()}`,
            date: today,
            amount: task.cost,
            category: 'House Maintenance',
            description: `Maintenance: ${task.title} (${task.serviceProvider})`,
            paymentMethod: 'Cash',
            paidTo: task.serviceProvider,
            createdAt: new Date().toISOString(),
          }
        : null;

    onUpdateDatabase({
      ...database,
      maintenanceTasks: updated,
      expenses: newExpense ? [newExpense, ...database.expenses] : database.expenses,
    });
  };

  // Calculations
  const totalMaintenanceCost = database.maintenanceTasks
    .filter((t) => t.status === 'completed')
    .reduce((acc, curr) => acc + curr.cost, 0);

  const pendingTasksCount = database.maintenanceTasks.filter(
    (t) => t.status === 'scheduled' || t.status === 'in_progress'
  ).length;

  const filteredTasks = database.maintenanceTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.serviceProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'scheduled'
        ? task.status === 'scheduled' || task.status === 'in_progress'
        : task.status === 'completed';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            {easy ? 'Ghar Ki Marammat (House Maintenance)' : 'House Maintenance & Repairs'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'AC service, plumber, bijli ka kaam aur karigaron ke contacts'
              : 'Service technicians, scheduled repairs, servicing cycles, and cost ledger'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Schedule Maintenance</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Marammat Ka Kul Kharcha' : 'Total Maintenance Cost'}
          </span>
          <p className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400 mt-1 tabular-nums">
            {formatCurrency(totalMaintenanceCost, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed repairs to date</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Scheduled / Pending Tasks</span>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {pendingTasksCount} Task{pendingTasksCount !== 1 ? 's' : ''}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Upcoming technician visits</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Trusted Technicians on File</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {new Set(database.maintenanceTasks.map((t) => t.serviceProvider)).size}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Plumbers, electricians & AC experts
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search task, service technician, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
              statusFilter === 'scheduled'
                ? 'bg-amber-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-800 text-amber-600 border-amber-200 dark:border-amber-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled ({pendingTasksCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white border-transparent'
                : 'bg-white dark:bg-slate-800 text-emerald-600 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Maintenance Tasks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const isDone = task.status === 'completed';

          return (
            <div
              key={task.id}
              className={`p-5 rounded-2xl bg-white dark:bg-[#0b172a] border transition-all shadow-sm flex flex-col justify-between ${
                isDone
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 dark:text-orange-400">
                      {task.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.serviceProvider}</span>
                      {task.providerPhone && (
                        <a
                          href={`tel:${task.providerPhone}`}
                          className="text-teal-600 hover:underline flex items-center gap-0.5 ml-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{task.providerPhone}</span>
                        </a>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1 text-slate-400 hover:text-teal-600 rounded"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cost & Dates */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Repair Cost
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(task.cost, currency, symbol)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      {isDone ? 'Completed Date' : 'Scheduled Date'}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatDate(isDone ? task.completedDate || task.scheduledDate : task.scheduledDate)}
                    </span>
                  </div>
                </div>

                {task.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 px-1">
                    {task.notes}
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled for {formatDate(task.scheduledDate)}
                    </span>
                  )}
                </div>

                {!isDone && (
                  <button
                    onClick={() => markCompleted(task)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                {editingTask ? 'Edit Maintenance Task' : 'Schedule Household Maintenance'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winter Gas Geyser Servicing"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Technician / Shop Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ustad Aslam Plumber"
                    value={formData.serviceProvider}
                    onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +92 300 1234567"
                    value={formData.providerPhone}
                    onChange={(e) => setFormData({ ...formData, providerPhone: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated / Actual Cost ({symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3500"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes & Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Burner cleaning and valve replacement required"
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
                >
                  {editingTask ? 'Save Changes' : 'Schedule Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
