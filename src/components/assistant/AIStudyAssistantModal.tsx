import React, { useState, useEffect, useRef } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { X, Send, Bot, Sparkles, User as UserIcon, Trash2 } from 'lucide-react';
import { getUserStorageKey } from '../../util/security';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIStudyAssistantModal: React.FC = () => {
  const { isAssistantOpen, setAssistantOpen, currentUser, subjects, exams, tasks, revisions } = usePlanner();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = currentUser ? currentUser.id : 'guest';
  const chatStorageKey = getUserStorageKey(userId, 'chat_messages');

  // Load user-scoped chat messages
  useEffect(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([
          {
            id: 'init',
            sender: 'assistant',
            text: `Hello ${currentUser?.name || 'Student'}! I am your Semester Study Assistant. How can I help you plan your studies or prepare for your upcoming exams today?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // fallback
    }
  }, [chatStorageKey, currentUser?.name]);

  // Persist user-scoped chat messages
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages));
      } catch {
        // ignore quota
      }
    }
  }, [messages, chatStorageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAssistantOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Contextual study guidance based on current student data
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('exam') || lower.includes('upcoming')) {
        if (exams.length === 0) {
          reply = "You don't have any exams scheduled right now. Go to the Exams section to add your upcoming test dates!";
        } else {
          const examSummary = exams.map((e) => `• ${e.title} (${e.examDate})`).join('\n');
          reply = `Here are your scheduled exams:\n${examSummary}\n\nMake sure your study tasks are scheduled on or before these dates so that your revision intervals fit properly!`;
        }
      } else if (lower.includes('revision') || lower.includes('review')) {
        const pending = revisions.filter((r) => !r.isCompleted);
        reply = `You have ${pending.length} pending revision cycle(s). In our spaced repetition strategy, revisions are generated automatically at 1, 3, 7, 14, and 30 day intervals after you mark a study session complete.`;
      } else if (lower.includes('task') || lower.includes('study')) {
        const pendingTasks = tasks.filter((t) => !t.isCompleted);
        reply = `You currently have ${pendingTasks.length} incomplete study task(s). Remember to use the 'Auto-Plan All Exams' button to distribute uncompleted topics leading up to your exams!`;
      } else {
        reply = `I'm here to support your semester goals. You currently have ${subjects.length} registered subject(s) and ${exams.length} exam milestone(s). What specific topic or schedule would you like help organizing?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
    }, 600);
  };

  const handleClearChat = () => {
    const fresh: ChatMessage[] = [
      {
        id: 'init_reset',
        sender: 'assistant',
        text: `Chat cleared. How can I assist you with your academic schedule?`,
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(fresh);
    localStorage.removeItem(chatStorageKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl h-[520px] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Study OS Assistant</h2>
              <p className="text-[10px] text-slate-400">Scoped to {currentUser?.email || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAssistantOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl max-w-[80%] whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/60'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 items-center text-slate-500 text-xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            placeholder="Ask about exams, revisions, or task schedules..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
