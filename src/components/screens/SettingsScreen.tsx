import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  Settings,
  Download,
  Upload,
  User,
  Shield,
  Moon,
  Sun,
  LogOut,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { applyTheme, getInitialTheme, ThemeMode } from '../../util/theme';

export const SettingsScreen: React.FC = () => {
  const { currentUser, logout, getBackupJson, restoreFromJson } = usePlanner();

  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleToggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const handleDownloadBackup = () => {
    const jsonStr = getBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `semester-study-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Restoring will replace your current study data with the backup file. Proceed?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreFromJson(content);
      setRestoreStatus(res);
      setTimeout(() => setRestoreStatus(null), 6000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-slate-400" />
          Settings & Data Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Backup your academic progress, adjust display preferences, and manage account isolation.
        </p>
      </div>

      {restoreStatus && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            restoreStatus.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {restoreStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          Account & Data Isolation
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/80">
          <div>
            <p className="text-white font-semibold text-sm">{currentUser?.name || 'Active Student'}</p>
            <p className="text-slate-400 text-xs">{currentUser?.email || 'student@university.edu'}</p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <Shield className="w-3.5 h-3.5" />
              Private Storage Sandbox Enabled (Isolated User State)
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Backup and Restore (Phase 8) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Complete Study OS Backup & Restore
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export a full JSON snapshot of your semesters, subjects, units, topics, exams, study tasks, and revisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export */}
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <h3 className="font-semibold text-white text-sm">Export Data</h3>
            <p className="text-xs text-slate-400">Download a verified JSON backup to your local device.</p>
            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup JSON</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
            <h3 className="font-semibold text-white text-sm">Restore Data</h3>
            <p className="text-xs text-slate-400">Upload a previously saved Semester Study OS backup file.</p>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Select File to Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Theme Preference */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
            Interface Appearance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Toggle between Dark Mode and Light Mode.</p>
        </div>
        <button
          onClick={handleToggleTheme}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </div>
    </div>
  );
};
