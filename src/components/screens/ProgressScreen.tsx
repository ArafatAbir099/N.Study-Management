import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  Layers,
  BookOpen,
  RotateCw,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  calculateSyllabusCoverage,
  calculateMasteryScore,
  calculateRevisionRetention,
  calculateExamReadiness,
  getChaptersNeedingReinforcement,
} from '../../util/progressMath';
import { getTodayString } from '../../util/dateUtils';

export const ProgressScreen: React.FC = () => {
  const { subjects, units, tasks, revisions, exams, topics, selectedSemester, setActiveScreen } = usePlanner();
  const today = getTodayString();

  const [isCoverageDetailOpen, setCoverageDetailOpen] = useState(false);
  const [isRetentionDetailOpen, setRetentionDetailOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // 1. Calculations
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
    return calculateExamReadiness(exams, subjects, units, tasks, revisions, selectedExamId, topics, today);
  }, [exams, subjects, units, tasks, revisions, selectedExamId, topics, today]);

  const reinforcementChapters = useMemo(() => {
    return getChaptersNeedingReinforcement(units, subjects, tasks, revisions, topics, today);
  }, [units, subjects, tasks, revisions, topics, today]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
          <Layers className="w-7 h-7 text-emerald-400" />
          Academic Progress
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real metrics for {selectedSemester?.name || 'Current Semester'} calculated from chapters, study sessions, and revisions.
        </p>
      </div>

      {/* Main Metric Cards Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: SYLLABUS COVERAGE */}
        <div
          onClick={() => setCoverageDetailOpen(true)}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 shadow-lg cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
          title="Tap to view chapter breakdown"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Syllabus Coverage</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            {coverage.isEmpty ? (
              <div className="py-2">
                <span className="text-lg font-bold text-slate-400">No chapters yet</span>
                <p className="text-xs text-slate-500 mt-1">Add chapters to start tracking coverage</p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{coverage.percentage}%</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {coverage.studiedChapters}/{coverage.totalChapters} chapters
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${coverage.percentage || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
            <span>View chapters detail</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* CARD 2: MASTERY SCORE */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Mastery Score</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            {mastery.isEmpty ? (
              <div className="py-2">
                <span className="text-lg font-bold text-slate-400">No ratings yet</span>
                <p className="text-xs text-slate-500 mt-1">Rate understanding (strong/okay/weak) when completing tasks</p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{mastery.percentage}%</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {mastery.totalRated} rated tasks
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${mastery.percentage || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="pt-3 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-medium">Strong: {mastery.strong}</span>
            <span className="text-blue-400 font-medium">Okay: {mastery.okay}</span>
            <span className="text-rose-400 font-medium">Weak: {mastery.weak}</span>
          </div>
        </div>

        {/* CARD 3: REVISION RETENTION */}
        <div
          onClick={() => setRetentionDetailOpen(true)}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 shadow-lg cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between"
          title="Tap to view revision schedule per chapter"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Revision Retention</span>
              <RotateCw className="w-4 h-4 text-indigo-400" />
            </div>
            {retention.isEmpty ? (
              <div className="py-2">
                <span className="text-lg font-bold text-slate-400">No revisions scheduled</span>
                <p className="text-xs text-slate-500 mt-1">Completing study tasks schedules spaced revisions</p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{retention.percentage}%</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {retention.completed}/{retention.total} completed
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${retention.percentage || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
            <span>View revisions schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* CARD 4: EXAM READINESS */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Exam Readiness</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            {readiness.status === 'no_exam' ? (
              <div className="py-2">
                <span className="text-lg font-bold text-slate-400">No exam added</span>
                <p className="text-xs text-slate-500 mt-1">Add an exam date to calculate milestone readiness</p>
              </div>
            ) : readiness.status === 'no_chapters' ? (
              <div className="py-2">
                <span className="text-lg font-bold text-slate-400">No chapters in subject</span>
                <p className="text-xs text-slate-500 mt-1">Add chapters to this exam&apos;s subject</p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{readiness.percentage}%</span>
                  <span className="text-xs text-slate-400 font-medium truncate max-w-[130px]">
                    {readiness.subject?.code || readiness.exam?.title}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${readiness.percentage || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="pt-3 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            {readiness.exam ? (
              <div className="flex items-center justify-between">
                <span className="truncate max-w-[140px] text-slate-300">{readiness.exam.title}</span>
                <span>
                  {readiness.studiedChaptersCount}/{readiness.totalChaptersCount} chaps
                </span>
              </div>
            ) : (
              <span>Calculated from studied chapters + revisions</span>
            )}
          </div>
        </div>
      </div>

      {/* Chapters Needing Reinforcement Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Chapters Needing Reinforcement
          </h2>
          <span className="text-xs text-slate-500">
            {reinforcementChapters.length} chapter{reinforcementChapters.length === 1 ? '' : 's'} identified
          </span>
        </div>

        {units.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No chapters yet. Create subjects and chapters to track reinforcement needs.
          </div>
        ) : reinforcementChapters.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-200">All caught up!</p>
            <p className="text-xs text-slate-500 mt-0.5">No chapters currently have weak understanding or overdue revisions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reinforcementChapters.map((item) => (
              <div
                key={item.chapter.id}
                className="p-4 bg-slate-900/70 border border-rose-500/20 rounded-xl space-y-2.5 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: `${item.subject?.color || '#3B82F6'}20`,
                        color: item.subject?.color || '#3B82F6',
                      }}
                    >
                      {item.subject?.code || item.subject?.name || 'Subject'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded font-medium">
                      Needs Attention
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-1.5">{item.chapter.title}</h3>
                  <div className="space-y-1 mt-2">
                    {item.reasons.map((reason, idx) => (
                      <p key={idx} className="text-xs text-rose-300/90 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
                  <button
                    onClick={() => setActiveScreen('tasks')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Schedule Study Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Coverage Breakdown */}
      <div className="space-y-4 pt-2">
        <h2 className="text-base font-bold text-white">Course Coverage Breakdown</h2>

        {subjects.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No subjects created yet. Add subjects to view syllabus breakdown.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverage.subjectDetails.map((sd) => (
              <div
                key={sd.subject.id}
                className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sd.subject.color }} />
                    <h3 className="font-bold text-white text-sm">{sd.subject.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {sd.percentage !== null ? `${sd.percentage}%` : 'No chapters'}
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${sd.percentage || 0}%`,
                      backgroundColor: sd.subject.color,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>{sd.studiedChapters}/{sd.totalChapters} Chapters Studied</span>
                  <span>{sd.totalStudySessions} study • {sd.totalRevisionSessions} revs</span>
                </div>

                {/* Per-chapter preview list */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  {sd.chapters.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No chapters in this course yet.</p>
                  ) : (
                    sd.chapters.map((chap) => (
                      <div
                        key={chap.chapterId}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/30"
                      >
                        <div className="flex items-center gap-2 truncate max-w-[200px]">
                          {chap.isStudied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                          )}
                          <span className={chap.isStudied ? 'text-slate-200 truncate' : 'text-slate-400 truncate'}>
                            {chap.chapterTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                          <span>{chap.studySessions}s ({chap.studyMinutes}m)</span>
                          <span>•</span>
                          <span className="text-indigo-400">{chap.revisionSessions}r ({chap.revisionMinutes}m)</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL 1: SYLLABUS COVERAGE FULL BREAKDOWN */}
      {isCoverageDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Syllabus Coverage & Chapter Study Time
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {coverage.studiedChapters} of {coverage.totalChapters} total chapters studied ({coverage.percentage || 0}%)
                </p>
              </div>
              <button
                onClick={() => setCoverageDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {coverage.subjectDetails.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No subjects or chapters recorded yet.</p>
              ) : (
                coverage.subjectDetails.map((sd) => (
                  <div key={sd.subject.id} className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sd.subject.color }} />
                        <h3 className="font-bold text-white text-sm">{sd.subject.code} — {sd.subject.name}</h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {sd.percentage !== null ? `${sd.percentage}% (${sd.studiedChapters}/${sd.totalChapters})` : 'No chapters'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-1.5 px-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400 text-[11px]">Normal Study: </span>
                        <span className="text-white font-semibold">{sd.totalStudySessions} sessions ({sd.totalStudyMinutes} mins)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Revisions: </span>
                        <span className="text-indigo-400 font-semibold">{sd.totalRevisionSessions} sessions ({sd.totalRevisionMinutes} mins)</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {sd.chapters.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No chapters in this course yet.</p>
                      ) : (
                        sd.chapters.map((chap) => (
                          <div
                            key={chap.chapterId}
                            className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {chap.isStudied ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-white truncate">{chap.chapterTitle}</p>
                                <span className={chap.isStudied ? 'text-[10px] text-emerald-400 font-medium' : 'text-[10px] text-slate-500'}>
                                  {chap.isStudied ? 'Studied' : 'Not studied yet'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right text-[11px] shrink-0">
                              <p className="text-slate-300 font-medium">
                                Study: {chap.studySessions} sessions • {chap.studyMinutes}m
                              </p>
                              <p className="text-indigo-400">
                                Revisions: {chap.revisionSessions} sessions • {chap.revisionMinutes}m
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setCoverageDetailOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL 2: REVISION RETENTION FULL BREAKDOWN */}
      {isRetentionDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-indigo-400" />
                  Revision Retention & Chapter Schedules
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {retention.completed} of {retention.total} total revisions completed ({retention.percentage || 0}%)
                </p>
              </div>
              <button
                onClick={() => setRetentionDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {retention.chaptersBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No chapters or revisions scheduled yet.</p>
              ) : (
                retention.chaptersBreakdown.map((item) => (
                  <div key={item.chapter.id} className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {item.subject && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                backgroundColor: `${item.subject.color}20`,
                                color: item.subject.color,
                              }}
                            >
                              {item.subject.code || item.subject.name}
                            </span>
                          )}
                          <h3 className="font-bold text-white text-sm">{item.chapter.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-emerald-400 font-semibold">{item.doneCount} done</span>
                        <span className="text-indigo-400 font-semibold">{item.todayCount} today</span>
                        <span className="text-rose-400 font-semibold">{item.overdueCount} overdue</span>
                        <span className="text-blue-400 font-semibold">{item.upcomingCount} upcoming</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {item.revisions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-1">No revisions scheduled yet for this chapter.</p>
                      ) : (
                        item.revisions.map((rev) => (
                          <div
                            key={rev.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              rev.isCompleted
                                ? 'bg-slate-900/60 border-slate-800/60 text-slate-400'
                                : rev.status === 'overdue'
                                ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                                : rev.status === 'today'
                                ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-200'
                                : 'bg-slate-900/80 border-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {rev.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <RotateCw className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              <span>{rev.title} (Rev #{rev.revisionNumber})</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                  rev.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : rev.status === 'today'
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : rev.status === 'overdue'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}
                              >
                                {rev.status === 'completed' ? 'Done' : rev.status}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {rev.isCompleted && rev.completedAt ? rev.completedAt.slice(0, 10) : rev.scheduledDate}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setRetentionDetailOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
