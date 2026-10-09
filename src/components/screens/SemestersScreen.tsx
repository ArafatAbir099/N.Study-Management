import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  FolderOpen,
} from 'lucide-react';
import { Semester } from '../../types';

export const SemestersScreen: React.FC = () => {
  const {
    semesters,
    selectedSemesterId,
    setSelectedSemesterId,
    createSemester,
    updateSemester,
    deleteSemester,
  } = usePlanner();

  const [isAddOpen, setAddOpen] = useState(false);
  const [editingSem, setEditingSem] = useState<Semester | null>(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleOpenAdd = () => {
    setEditingSem(null);
    setName('');
    const now = new Date();
    setStartDate(`${now.getFullYear()}-08-15`);
    setEndDate(`${now.getFullYear() + 1}-01-15`);
    setAddOpen(true);
  };

  const handleOpenEdit = (sem: Semester) => {
    setEditingSem(sem);
    setName(sem.name);
    setStartDate(sem.startDate);
    setEndDate(sem.endDate);
    setAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSem) {
      updateSemester(editingSem.id, {
        name: name.trim(),
        startDate,
        endDate,
      });
    } else {
      createSemester(name.trim(), startDate, endDate);
    }
    setAddOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <FolderOpen className="w-7 h-7 text-blue-400" />
            Semester Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Switch academic semesters or organize past and upcoming terms.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Semester</span>
        </button>
      </div>

      {/* Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingSem ? 'Edit Semester' : 'Add New Semester'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Semester Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spring 2027"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  Save Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semesters List */}
      <div className="space-y-3.5">
        {semesters.map((sem) => {
          const isSelected = selectedSemesterId === sem.id;

          return (
            <div
              key={sem.id}
              className={`p-5 rounded-2xl border transition-all shadow-md flex items-center justify-between gap-4 ${
                isSelected
                  ? 'bg-blue-950/20 border-blue-500/50 ring-1 ring-blue-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-white text-base">{sem.name}</h3>
                  {isSelected && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {sem.startDate || 'N/A'} — {sem.endDate || 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isSelected && (
                  <button
                    onClick={() => setSelectedSemesterId(sem.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(sem)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete semester "${sem.name}" and all its subjects, tasks, and revisions?`)) {
                      deleteSemester(sem.id);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
