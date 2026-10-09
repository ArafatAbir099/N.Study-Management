import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getTodayString, formatCountdown, diffDays, isValidDateString } from '../../util/dateUtils';
import { Exam } from '../../types';
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  MapPin,
  FileText,
  Edit2,
} from 'lucide-react';

export const ExamsScreen: React.FC = () => {
  const { exams, subjects, selectedSemester, createExam, updateExam, deleteExam } = usePlanner();

  const [isAddOpen, setAddOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examSubId, setExamSubId] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examLocation, setExamLocation] = useState('');
  const [examNotes, setExamNotes] = useState('');

  const today = getTodayString();

  // Sort exams by date
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      const aVal = isValidDateString(a.examDate) ? a.examDate : '9999-99-99';
      const bVal = isValidDateString(b.examDate) ? b.examDate : '9999-99-99';
      return aVal.localeCompare(bVal);
    });
  }, [exams]);

  const handleOpenAdd = () => {
    setEditingExam(null);
    setExamTitle('');
    setExamDate('');
    setExamSubId('');
    setExamTime('');
    setExamLocation('');
    setExamNotes('');
    setAddOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setExamTitle(exam.title);
    setExamDate(exam.examDate);
    setExamSubId(exam.subjectId || '');
    setExamTime(exam.examTime || '');
    setExamLocation(exam.location || '');
    setExamNotes(exam.notes || '');
    setAddOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;

    if (editingExam) {
      updateExam(editingExam.id, {
        title: examTitle.trim(),
        examDate,
        subjectId: examSubId || undefined,
        examTime: examTime.trim() || undefined,
        location: examLocation.trim() || undefined,
        notes: examNotes.trim() || undefined,
      });
    } else {
      createExam({
        title: examTitle.trim(),
        examDate,
        subjectId: examSubId || undefined,
        examTime: examTime.trim() || undefined,
        location: examLocation.trim() || undefined,
        notes: examNotes.trim() || undefined,
      });
    }

    setAddOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <AlertCircle className="w-7 h-7 text-amber-400" />
            Exams & Milestones
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Exam dates govern revision schedules and automated study task distribution.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-amber-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam</span>
        </button>
      </div>

      {/* Modal Add/Edit Exam */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingExam ? 'Edit Exam' : 'Add New Exam'}
            </h2>
            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Examination"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Associated Subject</label>
                <select
                  value={examSubId}
                  onChange={(e) => setExamSubId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">None / General</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} — {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Room / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Hall B, Room 304"
                  value={examLocation}
                  onChange={(e) => setExamLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring scientific calculator & ID card"
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                />
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium"
                >
                  {editingExam ? 'Save Changes' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Cards Grid */}
      <div className="space-y-3.5">
        {sortedExams.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No exams scheduled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add upcoming midterms or finals to enable automatic deadline-aware revision scheduling.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold"
            >
              Add First Exam
            </button>
          </div>
        ) : (
          sortedExams.map((exam) => {
            const sub = subjects.find((s) => s.id === exam.subjectId);
            const countdown = formatCountdown(exam.examDate);

            return (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-base">{exam.title}</h3>
                    {sub && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                      >
                        {sub.code} — {sub.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {exam.examDate}
                    </span>
                    {exam.examTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {exam.examTime}
                      </span>
                    )}
                    {exam.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {exam.location}
                      </span>
                    )}
                  </div>

                  {exam.notes && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                      <FileText className="w-3 h-3 text-slate-600 shrink-0" />
                      <span>{exam.notes}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl uppercase tracking-wider ${
                      countdown.isPast
                        ? 'bg-slate-800 text-slate-500'
                        : countdown.isToday
                        ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
                        : countdown.days <= 7
                        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {countdown.text}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit exam"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete exam "${exam.title}"?`)) {
                        deleteExam(exam.id);
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
