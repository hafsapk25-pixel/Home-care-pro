import React, { useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  UserCheck,
  Phone,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Briefcase,
  Wallet,
} from 'lucide-react';
import { FullHouseholdDatabase, HouseholdMember } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MembersViewProps {
  database: FullHouseholdDatabase;
  onUpdateDatabase: (updated: FullHouseholdDatabase) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ database, onUpdateDatabase }) => {
  const currency = database.settings.currency;
  const symbol = database.settings.currencySymbol;
  const easy = database.settings.easyWording;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    relation: 'Head of Family' as HouseholdMember['relation'],
    contact: '',
    role: 'Family Member' as HouseholdMember['role'],
    monthlyContribution: '',
    responsibilities: '',
  });

  const relations = [
    'Head of Family',
    'Spouse',
    'Father',
    'Mother',
    'Son',
    'Daughter',
    'Brother',
    'Sister',
    'Other',
  ];

  const colors = [
    'bg-teal-600',
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-purple-600',
    'bg-sky-600',
  ];

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      relation: 'Family Member' as any,
      contact: '',
      role: 'Family Member',
      monthlyContribution: '',
      responsibilities: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: HouseholdMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relation: member.relation,
      contact: member.contact,
      role: member.role,
      monthlyContribution: member.monthlyContribution.toString(),
      responsibilities: member.responsibilities.join(', '),
    });
    setIsModalOpen(true);
  };

  const handleDeleteMember = (id: string) => {
    if (database.members.length <= 1) {
      alert('You must have at least one household member!');
      return;
    }
    if (window.confirm('Are you sure you want to remove this family member?')) {
      const updated = database.members.filter((m) => m.id !== id);
      onUpdateDatabase({ ...database, members: updated });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter member name');
      return;
    }

    const contributionNum = parseFloat(formData.monthlyContribution) || 0;
    const respArray = formData.responsibilities
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    if (editingMember) {
      const updated = database.members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: formData.name,
              relation: formData.relation,
              contact: formData.contact,
              role: formData.role,
              monthlyContribution: contributionNum,
              responsibilities: respArray,
            }
          : m
      );
      onUpdateDatabase({ ...database, members: updated });
    } else {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newMember: HouseholdMember = {
        id: `mem_${Date.now()}`,
        name: formData.name,
        relation: formData.relation,
        contact: formData.contact,
        role: formData.role,
        monthlyContribution: contributionNum,
        responsibilities: respArray,
        avatarColor: randomColor,
      };
      onUpdateDatabase({ ...database, members: [...database.members, newMember] });
    }
    setIsModalOpen(false);
  };

  const totalHouseholdContribution = database.members.reduce(
    (acc, curr) => acc + curr.monthlyContribution,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {easy ? 'Ghar Ke Afraad (Family Members)' : 'Household Members & Family Roles'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {easy
              ? 'Khandan ke log, aamdani hissa, aur ghar ki zimadarian'
              : 'Family profiles, personal contributions, assigned chores, and access controls'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Family Member</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Total Household Members</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {database.members.length} Members
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Family profiles registered</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {easy ? 'Afraad Ka Kul Aamdani Hissa' : 'Total Monthly Family Contribution'}
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {formatCurrency(totalHouseholdContribution, currency, symbol)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Combined pooling pool</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">Active Earners</span>
          <p className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1 tabular-nums">
            {database.members.filter((m) => m.monthlyContribution > 0).length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Financially contributing to budget
          </span>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {database.members.map((member) => {
          // Calculate individual expenses by this member
          const memberExpenses = database.expenses
            .filter((e) => e.memberId === member.id)
            .reduce((acc, curr) => acc + curr.amount, 0);

          return (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0b172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm ${member.avatarColor}`}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {member.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {member.relation}
                        </span>
                        <span>·</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1 text-slate-400 hover:text-teal-600 rounded"
                      title="Edit Member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {member.contact && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-3">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.contact}</span>
                  </p>
                )}

                {/* Contribution & Expenses Metrics */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                      Monthly Contribution
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(member.monthlyContribution, currency, symbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                      Individual Expenses
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {formatCurrency(memberExpenses, currency, symbol)}
                    </span>
                  </div>
                </div>

                {/* Assigned Responsibilities & Chores */}
                {member.responsibilities && member.responsibilities.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                      Household Responsibilities / Chores:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.responsibilities.map((resp, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/40"
                        >
                          {resp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {editingMember ? 'Edit Member Profile' : 'Add Family Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Member Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Haris"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relation in Family *
                  </label>
                  <select
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {relations.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Contribution ({symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 240000"
                    value={formData.monthlyContribution}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyContribution: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Role / Access
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Family Member">Family Member</option>
                    <option value="Viewer">Viewer (Read Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="e.g. +92 300 1234567"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Household Responsibilities / Chores (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Grocery Shopping, Bill Payments, Pet Care"
                  value={formData.responsibilities}
                  onChange={(e) =>
                    setFormData({ ...formData, responsibilities: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
