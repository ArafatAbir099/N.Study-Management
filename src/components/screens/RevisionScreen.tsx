import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getTodayString, formatDisplayDate } from '../../util/dateUtils';
import { getRevisionStatus } from '../../util/revisionLifecycle';
import { formatBreadcrumb } from '../../util/breadcrumb';
import { RevisionRecord } from '../../types';
import {
  RotateCw,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  CheckCheck,
  Clock,
  Trash2,
} from 'lucide-react';

export const RevisionScreen: React.FC = () => {
  const { revisions, subjects, units, topics, tasks, completeRevision, deleteRevision } = usePlanner();
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const today = getTodayString();

  const categorizedRevisions = useMemo(() => {
    const todayList: RevisionRecord[] = [];
    const overdueList: RevisionRecord[] = [];
    const upcomingList: RevisionRecord[] = [];
    const completedList: RevisionRecord[] = [];

    for (const rev of revisions) {
      const status = getRevisionStatus(rev, today);
      if (status === 'completed') completedList.push(rev);
      else if (status === 'today') todayList.push(rev);
      else if (status === 'overdue') overdueList.push(rev);
      else if (status === 'upcoming') upcomingList.push(rev);
    }

    // Sort by scheduledDate
    todayList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    overdueList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    upcomingList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    completedList.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

    return { todayList, overdueList, upcomingList, completedList };
  }, [revisions, today]);

  const displayedList = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return categorizedRevisions.todayList;
      case 'overdue':
        return categorizedRevisions.overdueList;
      case 'upcoming':
        return categorizedRevisions.upcomingList;
      case 'completed':
        return categorizedRevisions.completedList;
      case 'all':
      default:
        return [
          ...categorizedRevisions.todayList,
          ...categorizedRevisions.overdueList,
          ...categorizedRevisions.upcomingList,
          ...categorizedRevisions.completedList,
        ];
    }
  }, [activeTab, categorizedRevisions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <RotateCw className="w-7 h-7 text-indigo-400" />
            Revision Lifecycle
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Spaced repetition schedules generated from completed study sessions.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <button
          onClick={() => setActiveTab('today')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'today'
              ? 'bg-indigo-600/20 border-indigo-500/60 ring-2 ring-indigo-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-300 font-medium">Due Today</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{categorizedRevisions.todayList.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'overdue'
              ? 'bg-rose-600/20 border-rose-500/60 ring-2 ring-rose-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-medium">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{categorizedRevisions.overdueList.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'upcoming'
              ? 'bg-blue-600/20 border-blue-500/60 ring-2 ring-blue-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-300 font-medium">Upcoming</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{categorizedRevisions.upcomingList.length}</p>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-600/20 border-emerald-500/60 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium">Completed</span>
            <CheckCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{categorizedRevisions.completedList.length}</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {(['today', 'overdue', 'upcoming', 'completed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab === 'today' ? "Today's Revisions" : tab}
          </button>
        ))}
      </div>

      {/* Revisions List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <RotateCw className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No revisions in this section</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {activeTab === 'today'
                ? "You have completed all revisions scheduled for today, or none are due yet!"
                : "Revisions will automatically appear here once study tasks are marked completed."}
            </p>
          </div>
        ) : (
          displayedList.map((rev) => {
            const sub = subjects.find((s) => s.id === rev.subjectId);
            const status = getRevisionStatus(rev, today);
            const task = tasks.find((t) => t.id === rev.studyTaskId);
            const unitId = rev.unitId || task?.unitId;
            const topicId = rev.topicId || task?.topicId;
            const breadcrumb = formatBreadcrumb(unitId, topicId, units, topics);

            return (
              <div
                key={rev.id}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                  rev.isCompleted
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : status === 'overdue'
                    ? 'bg-rose-950/20 border-rose-800/40 hover:border-rose-700'
                    : status === 'today'
                    ? 'bg-indigo-950/20 border-indigo-800/40 hover:border-indigo-700'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => completeRevision(rev.id, !rev.isCompleted)}
                    className="mt-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                    title={rev.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {rev.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${rev.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {rev.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-300">
                        Cycle #{rev.revisionNumber}
                      </span>
                      {status === 'overdue' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-500/20 text-rose-300">
                          Overdue
                        </span>
                      )}
                      {status === 'today' && !rev.isCompleted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-300">
                          Due Today
                        </span>
                      )}
                    </div>

                    {breadcrumb && (
                      <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                        {breadcrumb}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      {sub && (
                        <span
                          className="font-medium"
                          style={{ color: sub.color }}
                        >
                          {sub.code || sub.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDisplayDate(rev.scheduledDate)} ({rev.scheduledDate})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteRevision(rev.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete revision record"
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
