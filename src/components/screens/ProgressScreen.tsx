import React, { useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  Layers,
  BookOpen,
  RotateCw,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const ProgressScreen: React.FC = () => {
  const { subjects, units, topics, tasks, revisions, selectedSemester } = usePlanner();

  const totalTopics = topics.length;
  const completedTopics = topics.filter((t) => t.isCompleted).length;
  const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const totalRevs = revisions.length;
  const completedRevs = revisions.filter((r) => r.isCompleted).length;

  const subjectBreakdown = useMemo(() => {
    return subjects.map((sub) => {
      const subUnits = units.filter((u) => u.subjectId === sub.id);
      const subTopics = topics.filter((t) => t.subjectId === sub.id);
      const done = subTopics.filter((t) => t.isCompleted).length;
      const pct = subTopics.length > 0 ? Math.round((done / subTopics.length) * 100) : 0;
      return {
        ...sub,
        unitsCount: subUnits.length,
        topicsCount: subTopics.length,
        completedCount: done,
        pct,
      };
    });
  }, [subjects, units, topics]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
          <Layers className="w-7 h-7 text-emerald-400" />
          Academic Progress
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Detailed metrics and syllabus coverage for {selectedSemester?.name || 'Current Semester'}.
        </p>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Syllabus</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{overallPct}%</span>
            <span className="text-xs text-slate-400 font-medium">{completedTopics}/{totalTopics} topics</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Study Sessions</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{completedTasks}</span>
            <span className="text-xs text-slate-400 font-medium">of {totalTasks} tasks done</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Revision Mastery</span>
            <RotateCw className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{completedRevs}</span>
            <span className="text-xs text-slate-400 font-medium">of {totalRevs} revisions done</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${totalRevs > 0 ? (completedRevs / totalRevs) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject by Subject Mastery */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Course Coverage Breakdown</h2>

        {subjectBreakdown.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            No subjects created yet. Add subjects to view syllabus breakdown.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectBreakdown.map((sub) => (
              <div
                key={sub.id}
                className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                    <h3 className="font-bold text-white text-sm">{sub.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{sub.pct}%</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sub.pct}%`, backgroundColor: sub.color }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>{sub.unitsCount} Units</span>
                  <span>{sub.completedCount}/{sub.topicsCount} Topics Mastered</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
