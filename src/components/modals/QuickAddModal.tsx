import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { X, BookOpen, AlertCircle, Plus } from 'lucide-react';
import { getTodayString } from '../../util/dateUtils';
import { StudyTaskFields } from '../shared/StudyTaskFields';

export const QuickAddModal: React.FC = () => {
  const { isQuickAddOpen, setQuickAddOpen, subjects, createStudyTask, createExam } = usePlanner();
  const [tab, setTab] = useState<'task' | 'exam'>('task');

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubjectId, setTaskSubjectId] = useState('');
  const [taskUnitId, setTaskUnitId] = useState('');
  const [taskType, setTaskType] = useState<'study' | 'revision'>('study');
  const [taskDate, setTaskDate] = useState(getTodayString());
  const [taskMinutes, setTaskMinutes] = useState(45);

  // Exam form
  const [examTitle, setExamTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');

  if (!isQuickAddOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskSubjectId) return;

    if (!taskTitle.trim()) return;
    createStudyTask({
      title: taskTitle.trim(),
      subjectId: taskSubjectId,
      unitId: taskUnitId || undefined,
      taskType,
      scheduledDate: taskDate,
      estimatedMinutes: taskMinutes,
    });

    setTaskTitle('');
    setTaskUnitId('');
    setTaskType('study');
    setQuickAddOpen(false);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;
    createExam({
      title: examTitle.trim(),
      subjectId: examSubjectId || undefined,
      examDate,
    });
    setExamTitle('');
    setExamDate('');
    setQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Quick Add</h2>
          </div>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('task')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'task' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Study Task</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('exam')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              tab === 'exam' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Exam</span>
          </button>
        </div>

        {tab === 'task' ? (
          <form onSubmit={handleCreateTask} className="space-y-3.5">
            <StudyTaskFields
              subjectId={taskSubjectId}
              onSubjectChange={setTaskSubjectId}
              unitId={taskUnitId}
              onUnitChange={setTaskUnitId}
              taskType={taskType}
              onTaskTypeChange={setTaskType}
              title={taskTitle}
              onTitleChange={setTaskTitle}
              scheduledDate={taskDate}
              onNavigateToSubjects={() => setQuickAddOpen(false)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Minutes</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={taskMinutes}
                  onChange={(e) => setTaskMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                Create Task ({taskType === 'study' ? 'Normal Study' : 'Revision'})
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateExam} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Exam Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Midterm 1"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
              <select
                value={examSubjectId}
                onChange={(e) => setExamSubjectId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">General</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Exam Date *</label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 cursor-pointer"
              >
                Create Exam
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
