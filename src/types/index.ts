export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Semester {
  id: string;
  userId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  semesterId: string;
  code: string;
  name: string;
  color: string;
  targetGrade?: string;
  examDate?: string; // YYYY-MM-DD
  creditHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  userId: string;
  semesterId: string;
  subjectId: string;
  unitNumber: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  userId: string;
  semesterId: string;
  subjectId: string;
  unitId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  semesterId: string;
  subjectId?: string;
  title: string;
  examDate: string; // YYYY-MM-DD
  examTime?: string;
  location?: string;
  syllabusUnits?: string[];
  notes?: string;
  autoCreated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  userId: string;
  semesterId: string;
  subjectId: string;
  unitId?: string; // Chapter ID
  topicId?: string;
  taskType?: 'study' | 'revision'; // 'study' (Normal Study) | 'revision' (Revision)
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  estimatedMinutes: number;
  actualMinutes?: number;
  isCompleted: boolean;
  completedAt?: string;
  understanding?: 'weak' | 'okay' | 'strong';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionRecord {
  id: string;
  userId: string;
  semesterId: string;
  subjectId: string;
  unitId?: string;
  topicId?: string;
  studyTaskId: string; // Originating study task
  examId?: string;     // Associated exam
  revisionNumber: number; // 1, 2, 3...
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RevisionStatus = 'completed' | 'today' | 'overdue' | 'upcoming';

export interface StudyResource {
  id: string;
  userId: string;
  semesterId: string;
  subjectId?: string;
  title: string;
  type: 'link' | 'note';
  url?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  minutes: number;
  tasksCompleted: number;
  revisionsCompleted: number;
}

export type ActiveScreen = 
  | 'dashboard'
  | 'tasks'
  | 'subjects'
  | 'exams'
  | 'calendar'
  | 'progress'
  | 'resources'
  | 'semesters'
  | 'settings';
