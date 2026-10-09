import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getTodayString, formatDisplayDate } from '../../util/dateUtils';
import { formatBreadcrumb } from '../../util/breadcrumb';
import { StudyTaskFields } from '../shared/StudyTaskFields';
import { UnderstandingPicker } from '../shared/UnderstandingPicker';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const CalendarScreen: React.FC = () => {
  const {
    tasks,
    subjects,
    units,
    topics,
    selectedSemester,
    createStudyTask,
    deleteStudyTask,
    completeStudyTask,
    runAutoPlanAllExams,
  } = usePlanner();

  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubId, setNewTaskSubId] = useState('');
  const [newTaskUnitId, setNewTaskUnitId] = useState('');
  const [newTaskSelectedTopicIds, setNewTaskSelectedTopicIds] = useState<string[]>([]);
  const [newTaskMinutes, setNewTaskMinutes] = useState(45);
  const [autoPlanMessage, setAutoPlanMessage] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.scheduledDate === selectedDate);
  }, [tasks, selectedDate]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskSubId) return;

    if (newTaskSelectedTopicIds.length > 1) {
      for (const tId of newTaskSelectedTopicIds) {
        const topicObj = topics.find((t) => t.id === tId);
        createStudyTask({
          title: `Study: ${topicObj?.title || 'Topic'}`,
          subjectId: newTaskSubId,
          unitId: newTaskUnitId || undefined,
          topicId: tId,
          scheduledDate: selectedDate,
          estimatedMinutes: newTaskMinutes,
        });
      }
    } else if (newTaskSelectedTopicIds.length === 1) {
      const tId = newTaskSelectedTopicIds[0];
      const topicObj = topics.find((t) => t.id === tId);
      createStudyTask({
        title: newTaskTitle.trim() || `Study: ${topicObj?.title || 'Topic'}`,
        subjectId: newTaskSubId,
        unitId: newTaskUnitId || undefined,
        topicId: tId,
        scheduledDate: selectedDate,
        estimatedMinutes: newTaskMinutes,
      });
    } else {
      if (!newTaskTitle.trim()) return;
      createStudyTask({
        title: newTaskTitle.trim(),
        subjectId: newTaskSubId,
        unitId: newTaskUnitId || undefined,
        scheduledDate: selectedDate,
        estimatedMinutes: newTaskMinutes,
      });
    }

    setNewTaskTitle('');
    setNewTaskUnitId('');
    setNewTaskSelectedTopicIds([]);
    setAddTaskOpen(false);
  };

  const handleRunAutoPlan = () => {
    const res = runAutoPlanAllExams();
    setAutoPlanMessage(res.message);
    setTimeout(() => setAutoPlanMessage(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-blue-400" />
            Daily Study Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize daily tasks. Completing a task automatically schedules spaced revisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRunAutoPlan}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 font-medium rounded-xl text-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Auto-Plan All Exams</span>
          </button>

          <button
            onClick={() => setAddTaskOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {autoPlanMessage && (
        <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 flex items-center justify-between">
          <span>{autoPlanMessage}</span>
          <button onClick={() => setAutoPlanMessage(null)} className="text-indigo-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Date Selector Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Selected Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
          />
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium ml-2 cursor-pointer"
            >
              Jump to Today
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          {formatDisplayDate(selectedDate)} • {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'} scheduled
        </div>
      </div>

      {/* Modal Add Task */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Add Study Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <StudyTaskFields
                subjectId={newTaskSubId}
                onSubjectChange={setNewTaskSubId}
                unitId={newTaskUnitId}
                onUnitChange={setNewTaskUnitId}
                selectedTopicIds={newTaskSelectedTopicIds}
                onSelectedTopicIdsChange={setNewTaskSelectedTopicIds}
                title={newTaskTitle}
                onTitleChange={setNewTaskTitle}
                scheduledDate={selectedDate}
                onNavigateToSubjects={() => setAddTaskOpen(false)}
              />

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={newTaskMinutes}
                  onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddTaskOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium cursor-pointer"
                >
                  {newTaskSelectedTopicIds.length > 1
                    ? `Schedule ${newTaskSelectedTopicIds.length} Tasks`
                    : 'Schedule Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No study tasks for {formatDisplayDate(selectedDate)}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add tasks manually or use Auto-Plan to space out your study sessions before exams.
            </p>
            <button
              onClick={() => setAddTaskOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add Task for this Day
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const sub = subjects.find((s) => s.id === task.subjectId);
            const breadcrumb = formatBreadcrumb(task.unitId, task.topicId, units, topics);
            return (
              <div
                key={task.id}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                  task.isCompleted
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {task.isCompleted ? (
                    <button
                      onClick={() => completeStudyTask(task.id, false)}
                      className="mt-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                      title="Mark incomplete"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() => completeStudyTask(task.id, true, 'okay')}
                      className="mt-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                      title="Mark completed (Default: Okay)"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {task.title}
                    </p>
                    {breadcrumb && (
                      <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                        {breadcrumb}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                      {sub && (
                        <span
                          className="font-medium px-2 py-0.5 rounded-full text-[10px]"
                          style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                        >
                          {sub.code || sub.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {task.estimatedMinutes} mins
                      </span>
                      {task.isCompleted && task.understanding && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize font-medium">
                          {task.understanding}
                        </span>
                      )}
                      {task.isCompleted && task.completedAt && (
                        <span className="text-[11px] text-emerald-400 font-medium">
                          Completed on {task.completedAt.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!task.isCompleted && (
                    <UnderstandingPicker
                      onSelect={(und) => completeStudyTask(task.id, true, und)}
                    />
                  )}

                  <button
                    onClick={() => deleteStudyTask(task.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete task"
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
