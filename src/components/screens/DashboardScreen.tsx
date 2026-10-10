import React, { useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getTodayString, formatDisplayDate, formatCountdown, isValidDateString, diffDays } from '../../util/dateUtils';
import { getRevisionStatus } from '../../util/revisionLifecycle';
import { formatBreadcrumb } from '../../util/breadcrumb';
import { UnderstandingPicker } from '../shared/UnderstandingPicker';
import {
  BookOpen,
  RotateCw,
  Calendar,
  CheckCircle2,
  Circle,
  ArrowRight,
  AlertCircle,
  Clock,
  Layers,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  calculateSyllabusCoverage,
  calculateMasteryScore,
  calculateRevisionRetention,
  calculateExamReadiness,
} from '../../util/progressMath';

export const DashboardScreen: React.FC = () => {
  const {
    tasks,
    revisions,
    exams,
    subjects,
    units,
    topics,
    selectedSemester,
    completeStudyTask,
    completeRevision,
    setActiveScreen,
  } = usePlanner();

  const today = getTodayString();

  // 1. Today's Study tasks
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.scheduledDate === today);
  }, [tasks, today]);

  const pendingTasksToday = useMemo(() => {
    return todayTasks.filter((t) => !t.isCompleted);
  }, [todayTasks]);

  // 2. Today's Revision records (due today or overdue)
  const todayRevisions = useMemo(() => {
    return revisions.filter((r) => {
      const status = getRevisionStatus(r, today);
      return status === 'today' || status === 'overdue';
    });
  }, [revisions, today]);

  const pendingRevisionsToday = useMemo(() => {
    return todayRevisions.filter((r) => !r.isCompleted);
  }, [todayRevisions]);

  // 3. Upcoming Exam (closest future or today)
  const upcomingExam = useMemo(() => {
    const valid = exams
      .filter((e) => isValidDateString(e.examDate) && diffDays(e.examDate, today) >= 0)
      .sort((a, b) => diffDays(a.examDate, today) - diffDays(b.examDate, today));
    return valid.length > 0 ? valid[0] : null;
  }, [exams, today]);

  const upcomingExamSubject = useMemo(() => {
    if (!upcomingExam || !upcomingExam.subjectId) return null;
    return subjects.find((s) => s.id === upcomingExam.subjectId) || null;
  }, [upcomingExam, subjects]);

  // 4. Progress calculations
  const coverage = useMemo(() => {
    return calculateSyllabusCoverage(subjects, units, tasks, revisions, topics, today);
  }, [subjects, units, tasks, revisions, topics, today]);

  const mastery = useMemo(() => {
    return calculateMasteryScore(tasks);
  }, [tasks]);

  const retention = useMemo(() => {
    return calculateRevisionRetention(units, subjects, revisions, tasks, topics, today);
  }, [units, subjects, revisions, tasks, topics, today]);

  const readiness = useMemo(() => {
    return calculateExamReadiness(exams, subjects, units, tasks, revisions, null, topics, today);
  }, [exams, subjects, units, tasks, revisions, topics, today]);

  // 5. ONE Primary Action
  const primaryAction = useMemo(() => {
    if (pendingTasksToday.length > 0) {
      return {
        label: "Start today's study",
        subtext: `${pendingTasksToday.length} task${pendingTasksToday.length > 1 ? 's' : ''} remaining today`,
        onClick: () => setActiveScreen('tasks'),
        icon: BookOpen,
      };
    }
    if (pendingRevisionsToday.length > 0) {
      return {
        label: 'Complete daily revisions',
        subtext: `${pendingRevisionsToday.length} revision${pendingRevisionsToday.length > 1 ? 's' : ''} due`,
        onClick: () => {
          const revSection = document.getElementById('todays-revisions-section');
          if (revSection) {
            revSection.scrollIntoView({ behavior: 'smooth' });
          }
        },
        icon: RotateCw,
      };
    }
    return {
      label: 'All caught up for today!',
      subtext: 'View full study schedule & calendar',
      onClick: () => setActiveScreen('calendar'),
      icon: CheckCircle2,
    };
  }, [pendingTasksToday.length, pendingRevisionsToday.length, setActiveScreen]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner with ONE Primary Action */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border border-blue-500/20 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDisplayDate(today)} • {selectedSemester?.name || 'Semester Overview'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Study Command Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {primaryAction.subtext}
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={primaryAction.onClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <primaryAction.icon className="w-5 h-5" />
            <span>{primaryAction.label}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Grid containing the 4 Core Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: TODAY'S STUDY */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">Today&apos;s Study</h2>
                <p className="text-xs text-slate-400">
                  {todayTasks.filter((t) => t.isCompleted).length}/{todayTasks.length} completed
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('tasks')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-400">No study tasks for today</p>
                <p className="text-xs text-slate-500 mt-0.5">Use Quick Add to schedule a study session</p>
              </div>
            ) : (
              todayTasks.map((task) => {
                const sub = subjects.find((s) => s.id === task.subjectId);
                const breadcrumb = formatBreadcrumb(task.unitId, task.topicId, units, topics);
                const isRevision = task.taskType === 'revision';

                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                      task.isCompleted
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {task.isCompleted ? (
                        <button
                          onClick={() => completeStudyTask(task.id, false)}
                          className="mt-0.5 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer shrink-0"
                          title="Mark incomplete"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => completeStudyTask(task.id, true, 'okay')}
                          className="mt-0.5 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer shrink-0"
                          title="Mark complete (Default: Okay)"
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {task.title}
                          </p>
                          {/* Study / Revision Badge */}
                          {isRevision ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Revision
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Study
                            </span>
                          )}
                        </div>

                        {breadcrumb && (
                          <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                            {breadcrumb}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {sub && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                            >
                              {sub.code || sub.name}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes}m
                          </span>
                          {task.isCompleted && task.understanding && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize font-medium">
                              {task.understanding}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!task.isCompleted && (
                      <div className="shrink-0 pt-0.5">
                        <UnderstandingPicker
                          onSelect={(und) => completeStudyTask(task.id, true, und)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: TODAY'S REVISION (With "Done" Button) */}
        <div id="todays-revisions-section" className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">Today&apos;s Revision</h2>
                <p className="text-xs text-slate-400">
                  {todayRevisions.filter((r) => r.isCompleted).length}/{todayRevisions.length} completed
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('progress')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              Retention stats
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {todayRevisions.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl">
                <RotateCw className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-400">No revisions due today</p>
                <p className="text-xs text-slate-500 mt-0.5">Completing normal study tasks automatically triggers revision cycles</p>
              </div>
            ) : (
              todayRevisions.map((rev) => {
                const sub = subjects.find((s) => s.id === rev.subjectId);
                const status = getRevisionStatus(rev, today);
                const isOverdue = status === 'overdue';

                return (
                  <div
                    key={rev.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      rev.isCompleted
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : isOverdue
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-sm font-medium ${rev.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {rev.title}
                          </p>
                          {isOverdue && !rev.isCompleted && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {sub && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                            >
                              {sub.code || sub.name}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">
                            Rev #{rev.revisionNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {rev.scheduledDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PROMINENT "DONE" BUTTON */}
                    <div className="shrink-0">
                      {rev.isCompleted ? (
                        <button
                          onClick={() => completeRevision(rev.id, false)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Mark incomplete"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => completeRevision(rev.id, true)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 3: UPCOMING EXAM */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">Upcoming Exam</h2>
                <p className="text-xs text-slate-400">Closest academic milestone</p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('exams')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              View all
            </button>
          </div>

          {upcomingExam ? (
            (() => {
              const countdown = formatCountdown(upcomingExam.examDate);
              return (
                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{upcomingExam.title}</h3>
                      {upcomingExamSubject && (
                        <p className="text-xs text-amber-400 mt-0.5 font-medium">
                          {upcomingExamSubject.code} — {upcomingExamSubject.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg uppercase tracking-wider">
                        {countdown.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-amber-500/20">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {upcomingExam.examDate}
                    </span>
                    {upcomingExam.examTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {upcomingExam.examTime}
                      </span>
                    )}
                    {upcomingExam.location && (
                      <span className="text-slate-400 truncate max-w-[150px]">
                        📍 {upcomingExam.location}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl">
              <Calendar className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">No upcoming exams recorded</p>
              <p className="text-xs text-slate-500 mt-0.5">Add exam dates to automatic revision planning</p>
            </div>
          )}
        </div>

        {/* SECTION 4: PROGRESS (4 Core Metrics) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-base">Progress & Mastery</h2>
                <p className="text-xs text-slate-400">Real calculated semester metrics</p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('progress')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              Full details
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Syllabus Coverage Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Syllabus Coverage</span>
                <span className="text-emerald-400 font-semibold">
                  {coverage.isEmpty ? 'No chapters yet' : `${coverage.percentage}% (${coverage.studiedChapters}/${coverage.totalChapters} chaps)`}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${coverage.percentage || 0}%` }}
                />
              </div>
            </div>

            {/* 3 Metric Mini Cards */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Mastery Score */}
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 text-center">
                <span className="text-lg font-bold text-amber-400">
                  {mastery.isEmpty ? '—' : `${mastery.percentage}%`}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Mastery</p>
              </div>

              {/* Revision Retention */}
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 text-center">
                <span className="text-lg font-bold text-indigo-400">
                  {retention.isEmpty ? '—' : `${retention.percentage}%`}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Retention</p>
              </div>

              {/* Exam Readiness */}
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40 text-center">
                <span className="text-lg font-bold text-rose-400">
                  {readiness.isEmpty ? '—' : `${readiness.percentage}%`}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Readiness</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
