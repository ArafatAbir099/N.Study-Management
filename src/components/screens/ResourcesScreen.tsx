import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Folder, Plus, Trash2, ExternalLink, FileText, Link } from 'lucide-react';
import { StudyResource } from '../../types';
import { generateId } from '../../util/id';

export const ResourcesScreen: React.FC = () => {
  const { resources, subjects, selectedSemester } = usePlanner();
  const [localResources, setLocalResources] = useState<StudyResource[]>(resources);

  const [isAddOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'link' | 'note'>('link');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedSemester) return;

    const now = new Date().toISOString();
    const newRes: StudyResource = {
      id: generateId('res'),
      userId: selectedSemester.userId,
      semesterId: selectedSemester.id,
      subjectId: subjectId || undefined,
      title: title.trim(),
      type,
      url: type === 'link' ? url.trim() : undefined,
      content: type === 'note' ? content.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    setLocalResources((prev) => [...prev, newRes]);
    setTitle('');
    setUrl('');
    setContent('');
    setAddOpen(false);
  };

  const handleDelete = (id: string) => {
    setLocalResources((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Folder className="w-7 h-7 text-cyan-400" />
            Study Notes & Resources
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Store quick reference notes, lecture slide links, and study materials.
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resource</span>
        </button>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Add Study Resource</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 4 Slides & Formula Sheet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'link' | 'note')}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="link">Web Link</option>
                    <option value="note">Text Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">General</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} — {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {type === 'link' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Content</label>
                  <textarea
                    rows={4}
                    placeholder="Write key equations, formulas, or summaries..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localResources.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Folder className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No resources saved yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Save textbook links, lecture slides, formulas, or cheat sheets.
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              Add First Resource
            </button>
          </div>
        ) : (
          localResources.map((res) => {
            const sub = subjects.find((s) => s.id === res.subjectId);
            return (
              <div
                key={res.id}
                className="p-5 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-lg space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {res.type === 'link' ? (
                        <Link className="w-4 h-4 text-blue-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-400" />
                      )}
                      <h3 className="font-bold text-white text-sm">{res.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {sub && (
                    <span
                      className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1"
                      style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                    >
                      {sub.code} — {sub.name}
                    </span>
                  )}

                  {res.content && (
                    <p className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 mt-2 font-mono whitespace-pre-wrap">
                      {res.content}
                    </p>
                  )}
                </div>

                {res.url && (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium pt-2 border-t border-slate-800"
                  >
                    <span>Open External Resource</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
