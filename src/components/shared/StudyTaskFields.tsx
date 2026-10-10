import React, { useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { BookOpen, RotateCw, Plus } from 'lucide-react';

export interface StudyTaskFieldsProps {
  subjectId: string;
  onSubjectChange: (id: string) => void;
  unitId: string;
  onUnitChange: (id: string) => void;
  taskType: 'study' | 'revision';
  onTaskTypeChange: (type: 'study' | 'revision') => void;
  title: string;
  onTitleChange: (title: string) => void;
  scheduledDate: string;
  onNavigateToSubjects?: () => void;
}

export const StudyTaskFields: React.FC<StudyTaskFieldsProps> = ({
  subjectId,
  onSubjectChange,
  unitId,
  onUnitChange,
  taskType,
  onTaskTypeChange,
  title,
  onTitleChange,
  onNavigateToSubjects,
}) => {
  const { subjects, units, setActiveScreen } = usePlanner();

  // Subject chapters (units) ordered by unitNumber
  const subjectChapters = useMemo(() => {
    if (!subjectId) return [];
    return units
      .filter((u) => u.subjectId === subjectId)
      .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));
  }, [units, subjectId]);

  const hasNoChapters = Boolean(subjectId && subjectChapters.length === 0);

  const handleSubjectChange = (newSubjectId: string) => {
    onSubjectChange(newSubjectId);
    onUnitChange('');
    onTitleChange('');
  };

  const handleChapterChange = (newUnitId: string) => {
    onUnitChange(newUnitId);
    const chap = subjectChapters.find((c) => c.id === newUnitId);
    if (chap) {
      const prefix = taskType === 'revision' ? 'Revision: ' : 'Study: ';
      onTitleChange(`${prefix}${chap.title}`);
    } else {
      onTitleChange('');
    }
  };

  const handleTypeChange = (newType: 'study' | 'revision') => {
    onTaskTypeChange(newType);
    const chap = subjectChapters.find((c) => c.id === unitId);
    if (chap) {
      const prefix = newType === 'revision' ? 'Revision: ' : 'Study: ';
      onTitleChange(`${prefix}${chap.title}`);
    } else if (title) {
      if (newType === 'revision' && title.startsWith('Study: ')) {
        onTitleChange(title.replace('Study: ', 'Revision: '));
      } else if (newType === 'study' && title.startsWith('Revision: ')) {
        onTitleChange(title.replace('Revision: ', 'Study: '));
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Subject Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Subject <span className="text-rose-400">*</span>
        </label>
        <select
          required
          value={subjectId}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">Select a subject</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.code} — {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* No Chapters Notice */}
      {hasNoChapters && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span className="text-amber-300">No chapters added yet for this subject</span>
          <button
            type="button"
            onClick={() => {
              setActiveScreen('subjects');
              onNavigateToSubjects?.();
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors cursor-pointer text-xs shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>
        </div>
      )}

      {/* 2. Chapter Selector */}
      {subjectId && !hasNoChapters && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Chapter <span className="text-rose-400">*</span>
          </label>
          <select
            required
            value={unitId}
            onChange={(e) => handleChapterChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Select a chapter</option>
            {subjectChapters.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitNumber ? `Chapter ${u.unitNumber}: ` : ''}
                {u.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Required Choice: Normal Study vs Revision */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Task Purpose <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleTypeChange('study')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
              taskType === 'study'
                ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30 text-white'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className={taskType === 'study' ? 'text-blue-300' : ''}>Normal Study</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              First-time study • Counts in Syllabus Coverage • Auto-schedules revisions
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('revision')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
              taskType === 'revision'
                ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/30 text-white'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <RotateCw className="w-4 h-4 text-purple-400" />
              <span className={taskType === 'revision' ? 'text-purple-300' : ''}>Revision</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Extra review • Counts in Revision Retention • No new coverage
            </p>
          </button>
        </div>
      </div>

      {/* 4. Task Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Task Title <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Study: Chapter 1 Algorithms"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};
