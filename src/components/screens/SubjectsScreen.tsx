import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Layers,
  Edit2,
  ArrowUp,
  ArrowDown,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { parseSyllabus, ParsedUnit } from '../../util/syllabusParser';
import { Subject } from '../../types';

export const SubjectsScreen: React.FC = () => {
  const {
    subjects,
    units,
    topics,
    tasks,
    revisions,
    createSubject,
    updateSubject,
    deleteSubject,
    createUnit,
    updateUnit,
    deleteUnit,
    reorderUnit,
    createTopic,
    updateTopic,
    deleteTopic,
    reorderTopic,
    toggleTopicCompletion,
    importSyllabus,
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
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // Unit creation / inline edit state
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [addingUnitSubId, setAddingUnitSubId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitTitle, setEditingUnitTitle] = useState('');

  // Topic creation / inline edit state
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [addingTopicUnitId, setAddingTopicUnitId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState('');

  // Paste Syllabus Modal State
  const [pasteSyllabusSubId, setPasteSyllabusSubId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [previewUnits, setPreviewUnits] = useState<ParsedUnit[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
    const topicCount = topics.filter((t) => t.unitId === unitId).length;
    const taskCount = tasks.filter((t) => t.unitId === unitId).length;
    const revCount = revisions.filter((r) => r.unitId === unitId).length;

    const confirmed = window.confirm(
      `Delete unit "${unitTitle}"?\nThis will remove ${topicCount} topic(s), ${taskCount} study task(s), and ${revCount} revision record(s).`
    );

    if (confirmed) {
      deleteUnit(unitId);
    }
  };

  const handleCreateTopic = (unitId: string, subId: string) => {
    if (!newTopicTitle.trim()) return;
    createTopic(unitId, subId, newTopicTitle.trim());
    setNewTopicTitle('');
    setAddingTopicUnitId(null);
  };

  const handleStartEditTopic = (topicId: string, currentTitle: string) => {
    setEditingTopicId(topicId);
    setEditingTopicTitle(currentTitle);
  };

  const handleSaveTopicEdit = (topicId: string) => {
    if (editingTopicTitle.trim()) {
      updateTopic(topicId, { title: editingTopicTitle.trim() });
    }
    setEditingTopicId(null);
  };

  // Syllabus Parsing & Preview
  const handleOpenPasteSyllabus = (subId: string) => {
    setPasteSyllabusSubId(subId);
    setPastedText('');
    setPreviewUnits([]);
    setIsPreviewMode(false);
  };

  const handleParseSyllabus = () => {
    const parsed = parseSyllabus(pastedText);
    setPreviewUnits(parsed);
    setIsPreviewMode(true);
  };

  const handleSaveImportedSyllabus = () => {
    if (!pasteSyllabusSubId) return;
    importSyllabus(pasteSyllabusSubId, previewUnits);
    setPasteSyllabusSubId(null);
    setPastedText('');
    setPreviewUnits([]);
    setIsPreviewMode(false);
  };

  const handleUpdatePreviewUnitTitle = (index: number, title: string) => {
    setPreviewUnits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], title };
      return copy;
    });
  };

  const handleDeletePreviewUnit = (index: number) => {
    setPreviewUnits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePreviewTopic = (unitIndex: number, topicIndex: number, value: string) => {
    setPreviewUnits((prev) => {
      const copy = [...prev];
      const topicsCopy = [...copy[unitIndex].topics];
      topicsCopy[topicIndex] = value;
      copy[unitIndex] = { ...copy[unitIndex], topics: topicsCopy };
      return copy;
    });
  };

  const handleDeletePreviewTopic = (unitIndex: number, topicIndex: number) => {
    setPreviewUnits((prev) => {
      const copy = [...prev];
      const topicsCopy = copy[unitIndex].topics.filter((_, i) => i !== topicIndex);
      copy[unitIndex] = { ...copy[unitIndex], topics: topicsCopy };
      return copy;
    });
  };

  const handleAddPreviewTopic = (unitIndex: number, newTopic: string) => {
    if (!newTopic.trim()) return;
    setPreviewUnits((prev) => {
      const copy = [...prev];
      copy[unitIndex] = { ...copy[unitIndex], topics: [...copy[unitIndex].topics, newTopic.trim()] };
      return copy;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-blue-400" />
            Subjects & Syllabus
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage course structure, syllabus units, and topic progression.
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
                  onClick={() => {
                    setAddSubjectOpen(false);
                    setEditingSubject(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paste Syllabus Modal */}
      {pasteSyllabusSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Paste Syllabus</h2>
              </div>
              <button
                onClick={() => setPasteSyllabusSubId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {!isPreviewMode ? (
                <>
                  <p className="text-xs text-slate-400">
                    Paste your course syllabus below. Units will be detected from lines starting with "Unit", "Chapter", "Module", "#", or numbers ("1.", "1)"). Topics under units will be extracted from bullet points, indented lines, or comma-separated lists after "Topics:".
                  </p>
                  <textarea
                    rows={12}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Unit 1: Introduction to Data Structures\n- Array Representations\n- Linked Lists & Pointer Manipulations\n- Stacks and Queues\n\nUnit 2: Non-Linear Structures\n- Binary Search Trees\n- AVL Trees & Rotations\nTopics: Graph traversals, BFS, DFS`}
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Preview: {previewUnits.length} Units Found
                    </h3>
                    <button
                      onClick={() => setIsPreviewMode(false)}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      ← Back to Raw Text
                    </button>
                  </div>

                  {previewUnits.length === 0 ? (
                    <p className="text-xs text-amber-400 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      No units were detected. Please ensure units start with "Unit", "Chapter", "Module", or numbers like "1.".
                    </p>
                  ) : (
                    previewUnits.map((u, uIdx) => (
                      <div
                        key={uIdx}
                        className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={u.title}
                            onChange={(e) => handleUpdatePreviewUnitTitle(uIdx, e.target.value)}
                            className="flex-1 px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-white"
                          />
                          <span className="text-[11px] text-slate-400 px-2 py-0.5 bg-slate-800 rounded-full">
                            {u.topics.length} topics
                          </span>
                          <button
                            onClick={() => handleDeletePreviewUnit(uIdx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Remove unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Topics */}
                        <div className="pl-3 space-y-1.5 border-l border-slate-800">
                          {u.topics.map((top, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={top}
                                onChange={(e) => handleUpdatePreviewTopic(uIdx, tIdx, e.target.value)}
                                className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300"
                              />
                              <button
                                onClick={() => handleDeletePreviewTopic(uIdx, tIdx)}
                                className="text-slate-600 hover:text-rose-400 p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="+ Add topic..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddPreviewTopic(uIdx, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="px-2.5 py-1 bg-slate-900/40 border border-dashed border-slate-800 rounded text-xs text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPasteSyllabusSubId(null)}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              {!isPreviewMode ? (
                <button
                  type="button"
                  onClick={handleParseSyllabus}
                  disabled={!pastedText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
                >
                  Parse & Preview
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveImportedSyllabus}
                  disabled={previewUnits.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold"
                >
                  Import {previewUnits.length} Units to Subject
                </button>
              )}
            </div>
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
              Add university subjects to organize units, topics, and schedule study sessions.
            </p>
            <button
              onClick={handleOpenAddSubject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
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
            const subTopics = topics.filter((t) => t.subjectId === sub.id);
            const completedCount = subTopics.filter((t) => t.isCompleted).length;
            const pct = subTopics.length > 0 ? Math.round((completedCount / subTopics.length) * 100) : 0;

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
                        {completedCount}/{subTopics.length} topics
                      </span>
                      <div className="w-24 bg-slate-800 rounded-full h-2 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Paste Syllabus Button */}
                    <button
                      onClick={() => handleOpenPasteSyllabus(sub.id)}
                      className="p-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                      title="Paste course syllabus"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Paste Syllabus</span>
                    </button>

                    {/* Edit Subject Button */}
                    <button
                      onClick={() => handleOpenEditSubject(sub)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                      title="Edit subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Subject Button */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete subject "${sub.name}" and all its units/topics?`)) {
                          deleteSubject(sub.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Units & Topics */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/40 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-slate-500" />
                        Syllabus Units ({subUnits.length})
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenPasteSyllabus(sub.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Paste Syllabus
                        </button>
                        <button
                          onClick={() => setAddingUnitSubId(sub.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Unit
                        </button>
                      </div>
                    </div>

                    {addingUnitSubId === sub.id && (
                      <div className="flex gap-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                        <input
                          type="text"
                          placeholder="Unit title (e.g. Unit 1: Graph Algorithms)"
                          value={newUnitTitle}
                          onChange={(e) => setNewUnitTitle(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleCreateUnit(sub.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setAddingUnitSubId(null)}
                          className="px-2 py-1.5 text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {subUnits.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-500 italic mb-2">No syllabus units yet for this subject.</p>
                        <button
                          onClick={() => handleOpenPasteSyllabus(sub.id)}
                          className="px-3 py-1.5 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg text-xs font-medium"
                        >
                          Paste Syllabus from Course Guide
                        </button>
                      </div>
                    ) : (
                      subUnits.map((unit, uIdx) => {
                        const unitTopics = topics.filter((t) => t.unitId === unit.id);
                        const isUnitExpanded = expandedUnitId === unit.id;
                        const isEditingThisUnit = editingUnitId === unit.id;

                        return (
                          <div key={unit.id} className="border border-slate-800/90 rounded-xl bg-slate-900/40 p-3.5">
                            <div className="flex items-center justify-between gap-2">
                              {/* Left side: Expand + Title / Edit */}
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button
                                  onClick={() => setExpandedUnitId(isUnitExpanded ? null : unit.id)}
                                  className="text-slate-400 hover:text-white shrink-0"
                                >
                                  {isUnitExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>

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
                                      className="p-1 text-emerald-400 hover:text-emerald-300"
                                      title="Save rename"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingUnitId(null)}
                                      className="p-1 text-slate-400 hover:text-white"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setExpandedUnitId(isUnitExpanded ? null : unit.id)}
                                    className="flex items-center gap-2 text-left font-semibold text-sm text-slate-200 hover:text-white truncate"
                                  >
                                    <span className="truncate">{unit.title}</span>
                                    <span className="text-xs text-slate-500 font-normal shrink-0">
                                      ({unitTopics.length} topics)
                                    </span>
                                  </button>
                                )}
                              </div>

                              {/* Right side: Reorder + Edit + Add Topic + Delete */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => reorderUnit(sub.id, unit.id, 'up')}
                                  disabled={uIdx === 0}
                                  className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800"
                                  title="Move unit up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => reorderUnit(sub.id, unit.id, 'down')}
                                  disabled={uIdx === subUnits.length - 1}
                                  className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800"
                                  title="Move unit down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleStartEditUnit(unit.id, unit.title)}
                                  className="p-1 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800"
                                  title="Rename unit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setAddingTopicUnitId(unit.id)}
                                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5 px-2 py-1 rounded hover:bg-slate-800"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Topic</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUnitWithConfirm(unit.id, unit.title)}
                                  className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                                  title="Delete unit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Add Topic Input */}
                            {addingTopicUnitId === unit.id && (
                              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
                                <input
                                  type="text"
                                  placeholder="Topic name (e.g. Dijkstra's Algorithm)"
                                  value={newTopicTitle}
                                  onChange={(e) => setNewTopicTitle(e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                                />
                                <button
                                  onClick={() => handleCreateTopic(unit.id, sub.id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => setAddingTopicUnitId(null)}
                                  className="px-2 py-1.5 text-slate-400 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {/* Topics List */}
                            {isUnitExpanded && (
                              <div className="mt-3 space-y-1.5 pl-6 border-l border-slate-800">
                                {unitTopics.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">No topics under this unit yet.</p>
                                ) : (
                                  unitTopics.map((topic, tIdx) => {
                                    const isEditingThisTopic = editingTopicId === topic.id;

                                    return (
                                      <div
                                        key={topic.id}
                                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-colors"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <button
                                            onClick={() => toggleTopicCompletion(topic.id, !topic.isCompleted)}
                                            className="text-slate-400 hover:text-emerald-400 cursor-pointer shrink-0"
                                          >
                                            {topic.isCompleted ? (
                                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                              <Circle className="w-4 h-4" />
                                            )}
                                          </button>

                                          {isEditingThisTopic ? (
                                            <div className="flex items-center gap-1 flex-1">
                                              <input
                                                type="text"
                                                value={editingTopicTitle}
                                                onChange={(e) => setEditingTopicTitle(e.target.value)}
                                                className="flex-1 px-2 py-0.5 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => handleSaveTopicEdit(topic.id)}
                                                className="p-1 text-emerald-400"
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => setEditingTopicId(null)}
                                                className="p-1 text-slate-400"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <span
                                              className={`text-xs truncate ${
                                                topic.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                                              }`}
                                            >
                                              {topic.title}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => reorderTopic(unit.id, topic.id, 'up')}
                                            disabled={tIdx === 0}
                                            className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-20"
                                            title="Move topic up"
                                          >
                                            <ArrowUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => reorderTopic(unit.id, topic.id, 'down')}
                                            disabled={tIdx === unitTopics.length - 1}
                                            className="p-1 text-slate-600 hover:text-slate-300 disabled:opacity-20"
                                            title="Move topic down"
                                          >
                                            <ArrowDown className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => handleStartEditTopic(topic.id, topic.title)}
                                            className="p-1 text-slate-600 hover:text-slate-300"
                                            title="Rename topic"
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => deleteTopic(topic.id)}
                                            className="text-slate-600 hover:text-rose-400 p-1"
                                            title="Delete topic"
                                          >
                                            <Trash2 className="w-3 h-3" />
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
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
