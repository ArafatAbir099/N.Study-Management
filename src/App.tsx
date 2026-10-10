import React from 'react';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { SubjectsScreen } from './components/screens/SubjectsScreen';
import { CalendarScreen } from './components/screens/CalendarScreen';
import { ExamsScreen } from './components/screens/ExamsScreen';
import { ProgressScreen } from './components/screens/ProgressScreen';
import { SemestersScreen } from './components/screens/SemestersScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { ResourcesScreen } from './components/screens/ResourcesScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { QuickAddModal } from './components/modals/QuickAddModal';
import { FocusSessionModal } from './components/modals/FocusSessionModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { AIStudyAssistantModal } from './components/assistant/AIStudyAssistantModal';
import { ActiveScreen } from './types';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  AlertCircle,
  Layers,
  FolderOpen,
  Settings,
  Search,
  Plus,
  Clock,
  Bot,
  Folder,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    activeScreen,
    setActiveScreen,
    selectedSemester,
    semesters,
    setSelectedSemesterId,
    setQuickAddOpen,
    setSearchOpen,
    setFocusSessionOpen,
    setAssistantOpen,
  } = usePlanner();

  if (!currentUser) {
    return <AuthScreen />;
  }

  const navItems: { screen: ActiveScreen; label: string; icon: React.FC<{ className?: string }> }[] = [
    { screen: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { screen: 'tasks', label: "Daily Study", icon: BookOpen },
    { screen: 'subjects', label: 'Subjects', icon: BookOpen },
    { screen: 'exams', label: 'Exams', icon: AlertCircle },
    { screen: 'calendar', label: 'Schedule', icon: Calendar },
    { screen: 'progress', label: 'Progress', icon: Layers },
    { screen: 'resources', label: 'Resources', icon: Folder },
    { screen: 'semesters', label: 'Semesters', icon: FolderOpen },
    { screen: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shrink-0 p-4 justify-between">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/30">
              S
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Semester Study OS</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">University Planner</p>
            </div>
          </div>

          {/* Semester Selector Dropdown */}
          <div className="px-2">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Active Semester
            </label>
            <select
              value={selectedSemester?.id || ''}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeScreen === item.screen;
              const Icon = item.icon;
              return (
                <button
                  key={item.screen}
                  onClick={() => setActiveScreen(item.screen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info */}
        <div className="pt-4 border-t border-slate-800/80 px-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
          </div>
          <button
            onClick={() => setActiveScreen('settings')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300 md:hidden">Study OS</span>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search (Ctrl+K)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusSessionOpen(true)}
              className="p-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              title="Focus Session (Pomodoro)"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Focus</span>
            </button>

            <button
              onClick={() => setAssistantOpen(true)}
              className="p-2 text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              title="AI Study Assistant"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Assistant</span>
            </button>

            <button
              onClick={() => setQuickAddOpen(true)}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1"
              title="Quick Add Task or Exam"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Add</span>
            </button>
          </div>
        </header>

        {/* Screen Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeScreen === 'dashboard' && <DashboardScreen />}
          {activeScreen === 'tasks' && <CalendarScreen />}
          {activeScreen === 'subjects' && <SubjectsScreen />}
          {activeScreen === 'exams' && <ExamsScreen />}
          {activeScreen === 'calendar' && <CalendarScreen />}
          {activeScreen === 'progress' && <ProgressScreen />}
          {activeScreen === 'resources' && <ResourcesScreen />}
          {activeScreen === 'semesters' && <SemestersScreen />}
          {activeScreen === 'settings' && <SettingsScreen />}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden sticky bottom-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around p-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = activeScreen === item.screen;
            const Icon = item.icon;
            return (
              <button
                key={item.screen}
                onClick={() => setActiveScreen(item.screen)}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Modals */}
      <QuickAddModal />
      <FocusSessionModal />
      <GlobalSearchModal />
      <AIStudyAssistantModal />
    </div>
  );
};

export default function App() {
  return (
    <PlannerProvider>
      <MainLayout />
    </PlannerProvider>
  );
}
