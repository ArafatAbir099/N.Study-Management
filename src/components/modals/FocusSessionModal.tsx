import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { formatBreadcrumb } from '../../util/breadcrumb';
import { X, Play, Pause, RotateCcw, Clock } from 'lucide-react';

export const FocusSessionModal: React.FC = () => {
  const { isFocusSessionOpen, setFocusSessionOpen, tasks, units, topics, completeStudyTask } = usePlanner();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Auto complete selected task if any
      if (selectedTaskId) {
        completeStudyTask(selectedTaskId, true, 'okay');
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, selectedTaskId, completeStudyTask]);

  if (!isFocusSessionOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const handleCompleteWithUnderstanding = (understanding: 'weak' | 'okay' | 'strong') => {
    if (selectedTaskId) {
      completeStudyTask(selectedTaskId, true, understanding);
    }
    setFocusSessionOpen(false);
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const breadcrumb = selectedTask ? formatBreadcrumb(selectedTask.unitId, selectedTask.topicId, units, topics) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 text-center">
        <div className="flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Focus Session</h2>
          </div>
          <button
            onClick={() => setFocusSessionOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Selection */}
        <div className="text-left">
          <label className="block text-xs font-medium text-slate-400 mb-1">Focusing on:</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">General Focus / Deep Work</option>
            {pendingTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          {selectedTask && breadcrumb && (
            <p className="text-[11px] text-slate-400 mt-1.5">
              {breadcrumb}
            </p>
          )}
        </div>

        {/* Timer Display */}
        <div className="py-6">
          <span className="text-5xl font-extrabold text-white tracking-widest font-mono">
            {formattedTime}
          </span>
          <p className="text-xs text-slate-500 mt-2">Pomodoro Deep Focus</p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? 'Pause' : 'Start Focus'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Complete with Understanding Picker */}
        {selectedTaskId && (
          <div className="space-y-2 pt-2 border-t border-slate-800 text-left">
            <p className="text-xs text-slate-400">Complete task with understanding:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCompleteWithUnderstanding('weak')}
                className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Weak
              </button>
              <button
                type="button"
                onClick={() => handleCompleteWithUnderstanding('okay')}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer text-center"
              >
                Okay
              </button>
              <button
                type="button"
                onClick={() => handleCompleteWithUnderstanding('strong')}
                className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Strong
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
