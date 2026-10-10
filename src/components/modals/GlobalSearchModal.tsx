import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Search, X, BookOpen, AlertCircle, RotateCw, Layers } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setSearchOpen,
    subjects,
    units,
    tasks,
    revisions,
    exams,
    setActiveScreen,
  } = usePlanner();

  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { subjects: [], chapters: [], tasks: [], revisions: [], exams: [] };

    return {
      subjects: subjects.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)),
      chapters: units.filter((u) => u.title.toLowerCase().includes(q)),
      tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)),
      revisions: revisions.filter((r) => r.title.toLowerCase().includes(q)),
      exams: exams.filter((e) => e.title.toLowerCase().includes(q)),
    };
  }, [query, subjects, units, tasks, revisions, exams]);

  if (!isSearchOpen) return null;

  const totalResults =
    results.subjects.length +
    results.chapters.length +
    results.tasks.length +
    results.revisions.length +
    results.exams.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4">
        {/* Search input */}
        <div className="flex items-center gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search subjects, chapters, tasks, revisions, exams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-700/60 rounded-lg cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
          {query && totalResults === 0 && (
            <p className="text-xs text-slate-500 text-center py-8">No matching records found for &ldquo;{query}&rdquo;</p>
          )}

          {results.subjects.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subjects</p>
              <div className="space-y-1">
                {results.subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveScreen('subjects');
                      setSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white cursor-pointer"
                  >
                    <span>{s.code} — {s.name}</span>
                    <span className="text-[10px] text-slate-500">Subject</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.chapters.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Chapters</p>
              <div className="space-y-1">
                {results.chapters.map((u) => {
                  const sub = subjects.find((s) => s.id === u.subjectId);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setActiveScreen('subjects');
                        setSearchOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{u.title}</span>
                      </div>
                      {sub && <span className="text-[10px] text-slate-400 shrink-0">{sub.code}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {results.tasks.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Study Tasks</p>
              <div className="space-y-1">
                {results.tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveScreen('tasks');
                      setSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          t.taskType === 'revision'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {t.taskType === 'revision' ? 'Revision' : 'Study'}
                      </span>
                      <span className="truncate">{t.title}</span>
                    </div>
                    <span className="text-[10px] text-blue-400 shrink-0">{t.scheduledDate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.revisions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Revisions</p>
              <div className="space-y-1">
                {results.revisions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveScreen('dashboard');
                      setSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white cursor-pointer"
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="text-[10px] text-indigo-400 shrink-0">{r.scheduledDate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.exams.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exams</p>
              <div className="space-y-1">
                {results.exams.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setActiveScreen('exams');
                      setSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white cursor-pointer"
                  >
                    <span>{e.title}</span>
                    <span className="text-[10px] text-amber-400 shrink-0">{e.examDate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
