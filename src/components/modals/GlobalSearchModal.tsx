import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Search, X, BookOpen, AlertCircle, RotateCw, CheckCircle2 } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setSearchOpen,
    subjects,
    topics,
    tasks,
    revisions,
    exams,
    setActiveScreen,
  } = usePlanner();

  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { subjects: [], topics: [], tasks: [], revisions: [], exams: [] };

    return {
      subjects: subjects.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)),
      topics: topics.filter((t) => t.title.toLowerCase().includes(q)),
      tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)),
      revisions: revisions.filter((r) => r.title.toLowerCase().includes(q)),
      exams: exams.filter((e) => e.title.toLowerCase().includes(q)),
    };
  }, [query, subjects, topics, tasks, revisions, exams]);

  if (!isSearchOpen) return null;

  const totalResults =
    results.subjects.length +
    results.topics.length +
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
            placeholder="Search subjects, topics, tasks, revisions, exams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setSearchOpen(false)} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-700/60 rounded-lg">
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
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white"
                  >
                    <span>{s.code} — {s.name}</span>
                    <span className="text-[10px] text-slate-500">Subject</span>
                  </button>
                ))}
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
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white"
                  >
                    <span className="truncate">{t.title}</span>
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
                      setActiveScreen('revisions');
                      setSearchOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white"
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
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-xs flex items-center justify-between text-white"
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
