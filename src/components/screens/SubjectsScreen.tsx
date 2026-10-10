import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Layers,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  CheckCircle2,
  Clock,
  RotateCw,
} from 'lucide-react';
import { Subject } from '../../types';
import { getChapterStudyStats } from '../../util/progressMath';

export const SubjectsScreen: React.FC = () => {
  const {
    subjects,
    units,
    tasks,
    revisions,
    topics,
    createSubject,
    updateSubject,
    deleteSubject,
    createUnit,
    updateUnit,
    deleteUnit,
    reorderUnit,
  } = usePlanner();

  // Add / Edit Subject State
  const [isAddSubjectOpen, setAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subColor, setSubColor] = useState('#3B82F6');
  const [subExamDate, setSubExamDate] = useState('');

  // Expansion states
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);

  // Chapter creation / inline edit state
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [addingUnitSubId, setAddingUnitSubId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitTitle, setEditingUnitTitle] = useState('');

  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubCode('');
    setSubName('');
    setSubColor('#3B82F6');
    setSubExamDate('');
    setAddSubjectOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubCode(sub.code || '');
    setSubName(sub.name || '');
    setSubColor(sub.color || '#3B82F6');
    setSubExamDate(sub.examDate || '');
    setAddSubjectOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        code: subCode.trim() || subName.trim().slice(0, 4).toUpperCase(),
        name: subName.trim(),
        color: subColor,
        examDate: subExamDate || undefined,
      });
    } else {
      createSubject({
        code: subCode.trim() || subName.trim().slice(0, 4).toUpperCase(),
        name: subName.trim(),
        color: subColor,
        examDate: subExamDate || undefined,
      });
    }

    setAddSubjectOpen(false);
    setEditingSubject(null);
  };

  const handleCreateUnit = (subId: string) => {
    if (!newUnitTitle.trim()) return;
    createUnit(subId, newUnitTitle.trim());
    setNewUnitTitle('');
    setAddingUnitSubId(null);
  };

  const handleStartEditUnit = (unitId: string, currentTitle: string) => {
    setEditingUnitId(unitId);
    setEditingUnitTitle(currentTitle);
  };

  const handleSaveUnitEdit = (unitId: string) => {
    if (editingUnitTitle.trim()) {
      updateUnit(unitId, { title: editingUnitTitle.trim() });
    }
    setEditingUnitId(null);
  };

  const handleDeleteUnitWithConfirm = (unitId: string, unitTitle: string) => {
    const taskCount = tasks.filter((t) => t.unitId === unitId).length;
    const revCount = revisions.filter((r) => r.unitId === unitId).length;

    const confirmed = window.confirm(
      `Delete chapter "${unitTitle}"?\nThis will remove ${taskCount} study task(s) and ${revCount} revision record(s).`
    );

    if (confirmed) {
      deleteUnit(unitId);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-blue-400" />
            Subjects & Chapters
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage courses and chapter tracking. A chapter is the unit you study and revise.
          </p>
        </div>

        <button
          onClick={handleOpenAddSubject}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Add / Edit Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h2>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS201"
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Exam Date (Optional)</label>
                <input
                  type="date"
                  value={subExamDate}
                  onChange={(e) => setSubExamDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Color Tag</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSubColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        subColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddSubjectOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects List */}
      <div className="space-y-4">
        {subjects.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No subjects created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add university subjects to organize chapters and schedule study sessions.
            </p>
            <button
              onClick={handleOpenAddSubject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add First Subject
            </button>
          </div>
        ) : (
          subjects.map((sub) => {
            const isExpanded = expandedSubjectId === sub.id;
            const subUnits = units
              .filter((u) => u.subjectId === sub.id)
              .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));

            // Chapter statistics
            const chapterStats = subUnits.map((u) =>
              getChapterStudyStats(u, tasks, revisions, topics)
            );
            const studiedChaptersCount = chapterStats.filter((cs) => cs.isStudied).length;
            const totalChapters = subUnits.length;
            const pct = totalChapters > 0 ? Math.round((studiedChaptersCount / totalChapters) * 100) : null;

            return (
              <div
                key={sub.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Subject Header Row */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                      className="p-1.5 mt-0.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {sub.code}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">{sub.name}</h3>
                      {sub.examDate && (
                        <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Exam: {sub.examDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <span className="text-xs text-slate-400 font-medium">
                        {totalChapters === 0
                          ? 'No chapters yet'
                          : `${studiedChaptersCount}/${totalChapters} chapters studied`}
                      </span>
                      {totalChapters > 0 && (
                        <div className="w-24 bg-slate-800 rounded-full h-2 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Edit Subject Button */}
                    <button
                      onClick={() => handleOpenEditSubject(sub)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Subject Button */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete subject "${sub.name}" and all its chapters?`)) {
                          deleteSubject(sub.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Chapters */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-500" />
                        Chapters ({subUnits.length})
                      </h4>
                      <button
                        onClick={() => setAddingUnitSubId(sub.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Chapter
                      </button>
                    </div>

                    {addingUnitSubId === sub.id && (
                      <div className="flex gap-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                        <input
                          type="text"
                          placeholder="Chapter title (e.g. Chapter 1: Graph Algorithms)"
                          value={newUnitTitle}
                          onChange={(e) => setNewUnitTitle(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleCreateUnit(sub.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setAddingUnitSubId(null)}
                          className="px-2 py-1.5 text-slate-400 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {subUnits.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-500 italic mb-2">No chapters yet for this subject.</p>
                        <button
                          onClick={() => setAddingUnitSubId(sub.id)}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Add First Chapter
                        </button>
                      </div>
                    ) : (
                      subUnits.map((unit, uIdx) => {
                        const isEditingThisUnit = editingUnitId === unit.id;
                        const stats = chapterStats[uIdx];

                        return (
                          <div
                            key={unit.id}
                            className="border border-slate-800/90 rounded-xl bg-slate-900/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            {/* Left side: Chapter Title / Edit */}
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {stats.isStudied ? (
                                <span title="Studied">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                </span>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" title="Not studied yet" />
                              )}

                              {isEditingThisUnit ? (
                                <div className="flex items-center gap-1.5 flex-1">
                                  <input
                                    type="text"
                                    value={editingUnitTitle}
                                    onChange={(e) => setEditingUnitTitle(e.target.value)}
                                    className="flex-1 px-2.5 py-1 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveUnitEdit(unit.id)}
                                    className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                    title="Save rename"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingUnitId(null)}
                                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm text-slate-200 truncate">
                                    {unit.unitNumber ? `Chapter ${unit.unitNumber}: ` : ''}
                                    {unit.title}
                                  </p>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                                    <span className={stats.isStudied ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                                      {stats.isStudied ? 'Studied' : 'Not studied yet'}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      {stats.studySessions} study session{stats.studySessions === 1 ? '' : 's'} ({stats.studyMinutes}m)
                                    </span>
                                    <span className="flex items-center gap-1 text-indigo-400">
                                      <RotateCw className="w-3 h-3 text-indigo-400" />
                                      {stats.revisionSessions} revision{stats.revisionSessions === 1 ? '' : 's'} ({stats.revisionMinutes}m)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right side: Reorder + Edit + Delete */}
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => reorderUnit(sub.id, unit.id, 'up')}
                                disabled={uIdx === 0}
                                className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"
                                title="Move chapter up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => reorderUnit(sub.id, unit.id, 'down')}
                                disabled={uIdx === subUnits.length - 1}
                                className="p-1.5 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"
                                title="Move chapter down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleStartEditUnit(unit.id, unit.title)}
                                className="p-1.5 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800 cursor-pointer"
                                title="Rename chapter"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUnitWithConfirm(unit.id, unit.title)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                                title="Delete chapter"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
