import React, { useMemo, useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { AlertCircle } from 'lucide-react';

export interface StudyTaskFieldsProps {
  subjectId: string;
  onSubjectChange: (id: string) => void;
  unitId: string;
  onUnitChange: (id: string) => void;
  selectedTopicIds: string[];
  onSelectedTopicIdsChange: (ids: string[]) => void;
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
  selectedTopicIds,
  onSelectedTopicIdsChange,
  title,
  onTitleChange,
  scheduledDate,
  onNavigateToSubjects,
}) => {
  const { subjects, units, topics, tasks, setActiveScreen } = usePlanner();

  const [hideCompleted, setHideCompleted] = useState<boolean>(true);

  // Subject units ordered by unitNumber
  const subjectUnits = useMemo(() => {
    if (!subjectId) return [];
    return units
      .filter((u) => u.subjectId === subjectId)
      .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));
  }, [units, subjectId]);

  // Subject topics
  const subjectTopics = useMemo(() => {
    if (!subjectId) return [];
    return topics.filter((t) => t.subjectId === subjectId);
  }, [topics, subjectId]);

  const hasNoSyllabus = Boolean(
    subjectId && subjectUnits.length === 0 && subjectTopics.length === 0
  );

  // Unit topics
  const unitTopics = useMemo(() => {
    if (!unitId) return [];
    return topics.filter((t) => t.unitId === unitId);
  }, [topics, unitId]);

  const visibleTopics = useMemo(() => {
    if (!hideCompleted) return unitTopics;
    return unitTopics.filter((t) => !t.isCompleted);
  }, [unitTopics, hideCompleted]);

  // Warnings for active uncompleted tasks on other dates for selected topics
  const activeTaskWarnings = useMemo(() => {
    const msgs: string[] = [];
    for (const tId of selectedTopicIds) {
      const topicObj = topics.find((t) => t.id === tId);
      if (!topicObj) continue;
      const conflict = tasks.find(
        (task) => task.topicId === tId && !task.isCompleted && task.scheduledDate !== scheduledDate
      );
      if (conflict) {
        msgs.push(
          `Active task for "${topicObj.title}" is already scheduled on ${conflict.scheduledDate}.`
        );
      }
    }
    return msgs;
  }, [selectedTopicIds, topics, tasks, scheduledDate]);

  const handleSubjectChange = (newSubjectId: string) => {
    onSubjectChange(newSubjectId);
    onUnitChange('');
    onSelectedTopicIdsChange([]);
    onTitleChange('');
  };

  const handleUnitChange = (newUnitId: string) => {
    onUnitChange(newUnitId);
    onSelectedTopicIdsChange([]);
    onTitleChange('');
  };

  const handleToggleTopic = (topicIdToToggle: string) => {
    let nextIds: string[];
    if (selectedTopicIds.includes(topicIdToToggle)) {
      nextIds = selectedTopicIds.filter((id) => id !== topicIdToToggle);
    } else {
      nextIds = [...selectedTopicIds, topicIdToToggle];
    }
    onSelectedTopicIdsChange(nextIds);

    if (nextIds.length === 1) {
      const t = unitTopics.find((item) => item.id === nextIds[0]);
      onTitleChange(t ? `Study: ${t.title}` : '');
    } else if (nextIds.length === 0) {
      onTitleChange('');
    }
  };

  const handleToggleSelectAll = () => {
    const visibleIds = visibleTopics.map((t) => t.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedTopicIds.includes(id));

    if (allSelected) {
      onSelectedTopicIdsChange([]);
      onTitleChange('');
    } else {
      onSelectedTopicIdsChange(visibleIds);
      if (visibleIds.length === 1) {
        const t = unitTopics.find((item) => item.id === visibleIds[0]);
        onTitleChange(t ? `Study: ${t.title}` : '');
      }
    }
  };

  const isMultipleSelected = selectedTopicIds.length > 1;

  return (
    <div className="space-y-3.5">
      {/* 1. Subject Selector */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Subject <span className="text-rose-400">*</span>
        </label>
        <select
          required
          value={subjectId}
          onChange={(e) => handleSubjectChange(e.target.value)}
          className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">Select a subject</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.code} — {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* No Syllabus Notice */}
      {hasNoSyllabus && (
        <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-300">No syllabus yet</span>
          <button
            type="button"
            onClick={() => {
              setActiveScreen('subjects');
              onNavigateToSubjects?.();
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors cursor-pointer text-xs shrink-0"
          >
            Add Syllabus
          </button>
        </div>
      )}

      {/* 2. Unit Cascading Selector (Optional) */}
      {subjectId && !hasNoSyllabus && subjectUnits.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Unit <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <select
            value={unitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Select a unit (optional)</option>
            {subjectUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.unitNumber ? `Unit ${u.unitNumber}: ` : ''}
                {u.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Topics Checkbox List for chosen Unit */}
      {unitId && (
        <div className="space-y-2 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-medium text-slate-300">
              Topics{' '}
              <span className="text-slate-500 font-normal">
                ({selectedTopicIds.length} selected)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={(e) => setHideCompleted(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-800 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Hide completed</span>
              </label>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
              >
                {visibleTopics.length > 0 &&
                visibleTopics.every((t) => selectedTopicIds.includes(t.id))
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
            </div>
          </div>

          {unitTopics.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">No topics under this unit.</p>
          ) : visibleTopics.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-1">
              All topics in this unit are completed. Uncheck &quot;Hide completed&quot; to view them.
            </p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {visibleTopics.map((topic) => {
                const isChecked = selectedTopicIds.includes(topic.id);
                return (
                  <label
                    key={topic.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleTopic(topic.id)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-800 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span
                      className={`flex-1 truncate ${
                        topic.isCompleted ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {topic.title}
                    </span>
                    {topic.isCompleted && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
                        Completed
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active task warnings (Warn, do not block) */}
      {activeTaskWarnings.length > 0 && (
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {activeTaskWarnings.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
          </div>
        </div>
      )}

      {/* 4. Task Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-slate-300">
            Task Title {selectedTopicIds.length === 0 && <span className="text-rose-400">*</span>}
          </label>
          {isMultipleSelected && (
            <span className="text-[10px] text-blue-400 font-medium">
              Creating {selectedTopicIds.length} tasks (1 per topic)
            </span>
          )}
        </div>
        <input
          type="text"
          required={selectedTopicIds.length === 0}
          disabled={isMultipleSelected}
          placeholder={
            isMultipleSelected
              ? `Creating ${selectedTopicIds.length} tasks: Study: <topic title>`
              : selectedTopicIds.length === 1
              ? 'Study: <topic title>'
              : 'e.g. Read Chapter 4 & solve problems'
          }
          value={
            isMultipleSelected
              ? `One task per selected topic (${selectedTopicIds.length} tasks)`
              : title
          }
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};
