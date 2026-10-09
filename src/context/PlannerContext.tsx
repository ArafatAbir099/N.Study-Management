import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  Semester,
  Subject,
  Unit,
  Topic,
  Exam,
  StudyTask,
  RevisionRecord,
  StudyResource,
  ActiveScreen,
  DailyActivity,
} from '../types';
import { generateId } from '../util/id';
import { getTodayString } from '../util/dateUtils';
import {
  createRevisionsForTask,
  reconcileRevisionsOnExamChange,
  reconcileRevisionsOnNewExam,
  toggleRevisionCompletion,
  getNextExamForSubject,
} from '../util/revisionLifecycle';
import {
  StorageState,
  cascadeDeleteSemester,
  cascadeDeleteSubject,
  cascadeDeleteUnit,
  cascadeDeleteTopic,
} from '../util/hierarchy';
import { autoPlanAllExams } from '../util/revisionPlanner';
import { exportBackup, validateAndParseBackup } from '../util/backup';
import { getUserStorageKey } from '../util/security';
import { migrateLegacyStorageForUser } from '../util/migrations';
import { ParsedUnit } from '../util/syllabusParser';

interface PlannerContextType {
  // Auth
  currentUser: User | null;
  login: (email: string, name: string) => void;
  logout: () => void;

  // Active Screen
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;

  // Semester Selection
  selectedSemesterId: string | null;
  setSelectedSemesterId: (id: string | null) => void;
  selectedSemester: Semester | null;

  // Entities (Filtered by selectedSemesterId)
  semesters: Semester[];
  subjects: Subject[];
  units: Unit[];
  topics: Topic[];
  exams: Exam[];
  tasks: StudyTask[];
  revisions: RevisionRecord[];
  resources: StudyResource[];
  dailyActivities: DailyActivity[];

  // All unfiltered entities (for backup / overview if needed)
  allSubjects: Subject[];
  allTasks: StudyTask[];

  // Semester CRUD
  createSemester: (name: string, startDate: string, endDate: string) => Semester;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  deleteSemester: (id: string) => void;

  // Subject CRUD
  createSubject: (data: { code: string; name: string; color: string; examDate?: string; creditHours?: number; targetGrade?: string }) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Syllabus Import & Management
  importSyllabus: (subjectId: string, parsedUnits: ParsedUnit[]) => void;
  reorderUnit: (subjectId: string, unitId: string, direction: 'up' | 'down') => void;
  reorderTopic: (unitId: string, topicId: string, direction: 'up' | 'down') => void;

  // Unit CRUD
  createUnit: (subjectId: string, title: string, unitNumber?: number) => Unit;
  updateUnit: (id: string, updates: Partial<Unit>) => void;
  deleteUnit: (id: string) => void;

  // Topic CRUD
  createTopic: (unitId: string, subjectId: string, title: string) => Topic;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  toggleTopicCompletion: (id: string, isCompleted: boolean) => void;

  // Exam CRUD
  createExam: (data: { title: string; examDate: string; subjectId?: string; examTime?: string; location?: string; notes?: string }) => Exam;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Study Task CRUD
  createStudyTask: (data: { title: string; subjectId: string; scheduledDate: string; estimatedMinutes?: number; unitId?: string; topicId?: string; notes?: string }) => StudyTask;
  updateStudyTask: (id: string, updates: Partial<StudyTask>) => void;
  deleteStudyTask: (id: string) => void;
  completeStudyTask: (id: string, isCompleted: boolean, understanding?: 'weak' | 'okay' | 'strong') => void;

  // Revision CRUD
  completeRevision: (id: string, isCompleted: boolean) => void;
  deleteRevision: (id: string) => void;

  // Auto Planning
  runAutoPlanAllExams: () => { count: number; message: string };

  // Backup & Restore
  getBackupJson: () => string;
  restoreFromJson: (jsonString: string) => { success: boolean; message: string };

  // Modals state
  isQuickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isFocusSessionOpen: boolean;
  setFocusSessionOpen: (open: boolean) => void;
  isAssistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: 'user_default',
  email: 'student@university.edu',
  name: 'University Student',
};

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('study_os_active_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [selectedSemesterId, setSelectedSemesterIdState] = useState<string | null>(null);

  // Entities state (Raw, across all semesters)
  const [rawSemesters, setSemesters] = useState<Semester[]>([]);
  const [rawSubjects, setSubjects] = useState<Subject[]>([]);
  const [rawUnits, setUnits] = useState<Unit[]>([]);
  const [rawTopics, setTopics] = useState<Topic[]>([]);
  const [rawExams, setExams] = useState<Exam[]>([]);
  const [rawTasks, setTasks] = useState<StudyTask[]>([]);
  const [rawRevisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [rawResources, setResources] = useState<StudyResource[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);

  // Modals state
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isFocusSessionOpen, setFocusSessionOpen] = useState(false);
  const [isAssistantOpen, setAssistantOpen] = useState(false);

  const userId = currentUser ? currentUser.id : 'guest';

  // Load and isolate data per user
  useEffect(() => {
    if (!currentUser) return;
    migrateLegacyStorageForUser(currentUser.id);

    const dataKey = getUserStorageKey(currentUser.id, 'master_data');
    const semKey = getUserStorageKey(currentUser.id, 'selected_sem_id');

    try {
      const savedJson = localStorage.getItem(dataKey);
      if (savedJson) {
        const parsed = JSON.parse(savedJson) as StorageState;
        setSemesters(parsed.semesters || []);
        setSubjects(parsed.subjects || []);
        setUnits(parsed.units || []);
        setTopics(parsed.topics || []);
        setExams(parsed.exams || []);
        setTasks(parsed.tasks || []);
        setRevisions(parsed.revisions || []);
        setResources(parsed.resources || []);
      } else {
        // Seed default initial semester for new user
        const initialSemId = generateId('sem');
        const now = new Date();
        const start = `${now.getFullYear()}-08-15`;
        const end = `${now.getFullYear() + 1}-01-15`;
        const initSem: Semester = {
          id: initialSemId,
          userId: currentUser.id,
          name: 'Fall Semester',
          startDate: start,
          endDate: end,
          isCurrent: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSemesters([initSem]);
        setSubjects([]);
        setUnits([]);
        setTopics([]);
        setExams([]);
        setTasks([]);
        setRevisions([]);
        setResources([]);
      }

      const savedSemId = localStorage.getItem(semKey);
      if (savedSemId) {
        setSelectedSemesterIdState(savedSemId);
      }
    } catch (e) {
      console.error('Failed to load user study data:', e);
    }
  }, [currentUser?.id]);

  // Persist master data whenever state changes
  useEffect(() => {
    if (!currentUser) return;
    const dataKey = getUserStorageKey(currentUser.id, 'master_data');
    const payload: StorageState = {
      semesters: rawSemesters,
      subjects: rawSubjects,
      units: rawUnits,
      topics: rawTopics,
      exams: rawExams,
      tasks: rawTasks,
      revisions: rawRevisions,
      resources: rawResources,
    };
    try {
      localStorage.setItem(dataKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage quota or persistence error:', e);
    }
  }, [rawSemesters, rawSubjects, rawUnits, rawTopics, rawExams, rawTasks, rawRevisions, rawResources, currentUser?.id]);

  // Handle selected semester
  const setSelectedSemesterId = useCallback((id: string | null) => {
    setSelectedSemesterIdState(id);
    if (currentUser) {
      const semKey = getUserStorageKey(currentUser.id, 'selected_sem_id');
      if (id) {
        localStorage.setItem(semKey, id);
      } else {
        localStorage.removeItem(semKey);
      }
    }
  }, [currentUser]);

  // Ensure an active semester is selected
  useEffect(() => {
    if (rawSemesters.length > 0) {
      const valid = rawSemesters.find((s) => s.id === selectedSemesterId);
      if (!valid) {
        setSelectedSemesterId(rawSemesters[0].id);
      }
    } else {
      setSelectedSemesterId(null);
    }
  }, [rawSemesters, selectedSemesterId, setSelectedSemesterId]);

  const selectedSemester = useMemo(() => {
    return rawSemesters.find((s) => s.id === selectedSemesterId) || null;
  }, [rawSemesters, selectedSemesterId]);

  // Filtered views by selectedSemesterId for UI
  const subjects = useMemo(() => {
    return selectedSemesterId ? rawSubjects.filter((s) => s.semesterId === selectedSemesterId) : rawSubjects;
  }, [rawSubjects, selectedSemesterId]);

  const units = useMemo(() => {
    if (!selectedSemesterId) return rawUnits;
    const subjectIds = new Set(subjects.map((s) => s.id));
    return rawUnits.filter((u) => u.semesterId === selectedSemesterId || subjectIds.has(u.subjectId));
  }, [rawUnits, selectedSemesterId, subjects]);

  const topics = useMemo(() => {
    if (!selectedSemesterId) return rawTopics;
    const subjectIds = new Set(subjects.map((s) => s.id));
    return rawTopics.filter((t) => t.semesterId === selectedSemesterId || subjectIds.has(t.subjectId));
  }, [rawTopics, selectedSemesterId, subjects]);

  const exams = useMemo(() => {
    return selectedSemesterId ? rawExams.filter((e) => e.semesterId === selectedSemesterId) : rawExams;
  }, [rawExams, selectedSemesterId]);

  const tasks = useMemo(() => {
    return selectedSemesterId ? rawTasks.filter((t) => t.semesterId === selectedSemesterId) : rawTasks;
  }, [rawTasks, selectedSemesterId]);

  const revisions = useMemo(() => {
    return selectedSemesterId ? rawRevisions.filter((r) => r.semesterId === selectedSemesterId) : rawRevisions;
  }, [rawRevisions, selectedSemesterId]);

  const resources = useMemo(() => {
    return selectedSemesterId ? rawResources.filter((res) => res.semesterId === selectedSemesterId) : rawResources;
  }, [rawResources, selectedSemesterId]);

  // Auth operations
  const login = useCallback((email: string, name: string) => {
    const user: User = {
      id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email,
      name,
    };
    localStorage.setItem('study_os_active_user', JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('study_os_active_user');
  }, []);

  // --- SEMESTER CRUD ---
  const createSemester = useCallback((name: string, startDate: string, endDate: string): Semester => {
    const now = new Date().toISOString();
    const newSem: Semester = {
      id: generateId('sem'),
      userId,
      name,
      startDate,
      endDate,
      createdAt: now,
      updatedAt: now,
    };
    setSemesters((prev) => [...prev, newSem]);
    setSelectedSemesterId(newSem.id);
    return newSem;
  }, [userId, setSelectedSemesterId]);

  const updateSemester = useCallback((id: string, updates: Partial<Semester>) => {
    setSemesters((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
  }, []);

  // Phase C.8: No setState inside other setState updaters
  const deleteSemester = useCallback((id: string) => {
    const nextState = cascadeDeleteSemester(
      {
        semesters: rawSemesters,
        subjects: rawSubjects,
        units: rawUnits,
        topics: rawTopics,
        exams: rawExams,
        tasks: rawTasks,
        revisions: rawRevisions,
        resources: rawResources,
      },
      id
    );
    setSemesters(nextState.semesters);
    setSubjects(nextState.subjects);
    setUnits(nextState.units);
    setTopics(nextState.topics);
    setExams(nextState.exams);
    setTasks(nextState.tasks);
    setRevisions(nextState.revisions);
    setResources(nextState.resources);
  }, [rawSemesters, rawSubjects, rawUnits, rawTopics, rawExams, rawTasks, rawRevisions, rawResources]);

  // --- SUBJECT CRUD ---
  const createSubject = useCallback((data: {
    code: string;
    name: string;
    color: string;
    examDate?: string;
    creditHours?: number;
    targetGrade?: string;
  }): Subject => {
    if (!selectedSemesterId) {
      throw new Error('Please select or create a semester first.');
    }
    const now = new Date().toISOString();
    const newSubject: Subject = {
      id: generateId('sub'),
      userId,
      semesterId: selectedSemesterId,
      code: data.code,
      name: data.name,
      color: data.color || '#3B82F6',
      examDate: data.examDate || undefined,
      creditHours: data.creditHours || 3,
      targetGrade: data.targetGrade || 'A',
      createdAt: now,
      updatedAt: now,
    };

    setSubjects((prev) => [...prev, newSubject]);

    // Phase C.2: When subject.examDate is set, upsert exactly ONE linked exam; never create duplicates
    if (data.examDate) {
      const newExam: Exam = {
        id: generateId('exam'),
        userId,
        semesterId: selectedSemesterId,
        subjectId: newSubject.id,
        title: `${data.code || data.name} Exam`,
        examDate: data.examDate,
        autoCreated: true,
        createdAt: now,
        updatedAt: now,
      };
      setExams((prev) => {
        const duplicate = prev.some((e) => e.subjectId === newSubject.id && e.examDate === data.examDate);
        return duplicate ? prev : [...prev, newExam];
      });
    }

    return newSubject;
  }, [selectedSemesterId, userId]);

  // Phase C.2 & C.8: updateSubject upserts exactly one linked exam and eliminates nested setState
  const updateSubject = useCallback((id: string, updates: Partial<Subject>) => {
    const now = new Date().toISOString();

    const targetSub = rawSubjects.find((s) => s.id === id);
    if (!targetSub) return;

    const updatedSub: Subject = {
      ...targetSub,
      ...updates,
      updatedAt: now,
    };

    const nextSubjects = rawSubjects.map((s) => (s.id === id ? updatedSub : s));
    setSubjects(nextSubjects);

    // If examDate changed
    if (updates.examDate !== undefined && updates.examDate !== targetSub.examDate) {
      let nextExams = [...rawExams];
      let linkedExam = nextExams.find((e) => e.subjectId === id && e.autoCreated === true);

      if (updates.examDate) {
        if (linkedExam) {
          linkedExam = { ...linkedExam, examDate: updates.examDate, updatedAt: now };
          nextExams = nextExams.map((e) => (e.id === linkedExam!.id ? linkedExam! : e));
        } else {
          linkedExam = {
            id: generateId('exam'),
            userId,
            semesterId: targetSub.semesterId,
            subjectId: id,
            title: `${updatedSub.code || updatedSub.name} Exam`,
            examDate: updates.examDate,
            autoCreated: true,
            createdAt: now,
            updatedAt: now,
          };
          nextExams.push(linkedExam);
        }
        // Deduplicate any extra exams for same subject and date
        const seen = new Set<string>();
        nextExams = nextExams.filter((e) => {
          if (e.subjectId === id) {
            const key = `${e.subjectId}_${e.examDate}`;
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        });

        setExams(nextExams);

        // Reconcile revisions on exam change
        const nextRevs = reconcileRevisionsOnExamChange(rawRevisions, linkedExam, rawTasks);
        setRevisions(nextRevs);
      } else {
        // If examDate was removed, remove only auto-created exams for this subject
        const removedExamIds = new Set(
          rawExams.filter((e) => e.subjectId === id && e.autoCreated).map((e) => e.id)
        );
        nextExams = rawExams.filter((e) => !removedExamIds.has(e.id));
        setExams(nextExams);

        // Also clear examId on affected pending revisions
        setRevisions((prevRevs) =>
          prevRevs.map((r) =>
            r.examId && removedExamIds.has(r.examId) && !r.isCompleted
              ? { ...r, examId: undefined }
              : r
          )
        );
      }
    }
  }, [rawSubjects, rawExams, rawRevisions, rawTasks, userId]);

  const deleteSubject = useCallback((id: string) => {
    const nextState = cascadeDeleteSubject(
      {
        semesters: rawSemesters,
        subjects: rawSubjects,
        units: rawUnits,
        topics: rawTopics,
        exams: rawExams,
        tasks: rawTasks,
        revisions: rawRevisions,
        resources: rawResources,
      },
      id
    );
    setSubjects(nextState.subjects);
    setUnits(nextState.units);
    setTopics(nextState.topics);
    setExams(nextState.exams);
    setTasks(nextState.tasks);
    setRevisions(nextState.revisions);
    setResources(nextState.resources);
  }, [rawSemesters, rawSubjects, rawUnits, rawTopics, rawExams, rawTasks, rawRevisions, rawResources]);

  // --- UNIT CRUD ---
  // Renumber unitNumber using max+1, never length+1
  const createUnit = useCallback((subjectId: string, title: string, unitNumber?: number): Unit => {
    if (!selectedSemesterId) throw new Error('No semester selected.');
    const now = new Date().toISOString();
    const existingUnits = rawUnits.filter((u) => u.subjectId === subjectId);
    const maxNum = existingUnits.reduce((max, u) => Math.max(max, u.unitNumber || 0), 0);
    const num = unitNumber || maxNum + 1;
    const newUnit: Unit = {
      id: generateId('unit'),
      userId,
      semesterId: selectedSemesterId,
      subjectId,
      unitNumber: num,
      title,
      createdAt: now,
      updatedAt: now,
    };
    setUnits((prev) => [...prev, newUnit]);
    return newUnit;
  }, [selectedSemesterId, userId, rawUnits]);

  const updateUnit = useCallback((id: string, updates: Partial<Unit>) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u))
    );
  }, []);

  const deleteUnit = useCallback((id: string) => {
    const unitToDelete = rawUnits.find((u) => u.id === id);
    const nextState = cascadeDeleteUnit(
      {
        semesters: rawSemesters,
        subjects: rawSubjects,
        units: rawUnits,
        topics: rawTopics,
        exams: rawExams,
        tasks: rawTasks,
        revisions: rawRevisions,
        resources: rawResources,
      },
      id
    );

    // Renumber remaining units for that subject sequentially starting from 1
    let finalUnits = nextState.units;
    if (unitToDelete) {
      const subjectUnits = finalUnits
        .filter((u) => u.subjectId === unitToDelete.subjectId)
        .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));

      const renumberedMap = new Map<string, number>();
      subjectUnits.forEach((u, idx) => {
        renumberedMap.set(u.id, idx + 1);
      });

      finalUnits = finalUnits.map((u) =>
        renumberedMap.has(u.id) ? { ...u, unitNumber: renumberedMap.get(u.id)! } : u
      );
    }

    setUnits(finalUnits);
    setTopics(nextState.topics);
    setTasks(nextState.tasks);
    setRevisions(nextState.revisions);
  }, [rawSemesters, rawSubjects, rawUnits, rawTopics, rawExams, rawTasks, rawRevisions, rawResources]);

  // Reorder Units
  const reorderUnit = useCallback((subjectId: string, unitId: string, direction: 'up' | 'down') => {
    const subjectUnits = rawUnits
      .filter((u) => u.subjectId === subjectId)
      .sort((a, b) => (a.unitNumber || 0) - (b.unitNumber || 0));

    const index = subjectUnits.findIndex((u) => u.id === unitId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subjectUnits.length) return;

    // Swap positions
    const temp = subjectUnits[index];
    subjectUnits[index] = subjectUnits[targetIndex];
    subjectUnits[targetIndex] = temp;

    const renumberedMap = new Map<string, number>();
    subjectUnits.forEach((u, idx) => {
      renumberedMap.set(u.id, idx + 1);
    });

    setUnits((prev) =>
      prev.map((u) =>
        renumberedMap.has(u.id) ? { ...u, unitNumber: renumberedMap.get(u.id)! } : u
      )
    );
  }, [rawUnits]);

  // Reorder Topics
  const reorderTopic = useCallback((unitId: string, topicId: string, direction: 'up' | 'down') => {
    setTopics((prev) => {
      const unitTopics = prev.filter((t) => t.unitId === unitId);
      const index = unitTopics.findIndex((t) => t.id === topicId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= unitTopics.length) return prev;

      const swappedTopics = [...unitTopics];
      const temp = swappedTopics[index];
      swappedTopics[index] = swappedTopics[targetIndex];
      swappedTopics[targetIndex] = temp;

      // Rebuild entire topics list preserving new unit order
      const otherTopics = prev.filter((t) => t.unitId !== unitId);
      return [...otherTopics, ...swappedTopics];
    });
  }, []);

  // --- SYLLABUS IMPORT (PHASE A.2) ---
  const importSyllabus = useCallback((subjectId: string, parsedUnits: ParsedUnit[]) => {
    if (!selectedSemesterId) return;
    const now = new Date().toISOString();

    const existingSubjectUnits = rawUnits.filter((u) => u.subjectId === subjectId);
    let maxUnitNum = existingSubjectUnits.reduce((max, u) => Math.max(max, u.unitNumber || 0), 0);

    const newUnitsToAdd: Unit[] = [];
    const newTopicsToAdd: Topic[] = [];

    for (const pUnit of parsedUnits) {
      if (!pUnit.title.trim()) continue;

      // Case-insensitive match for unit title
      let targetUnit = existingSubjectUnits.find(
        (u) => u.title.trim().toLowerCase() === pUnit.title.trim().toLowerCase()
      );

      if (!targetUnit) {
        targetUnit = newUnitsToAdd.find(
          (u) => u.title.trim().toLowerCase() === pUnit.title.trim().toLowerCase()
        );
      }

      if (!targetUnit) {
        maxUnitNum += 1;
        targetUnit = {
          id: generateId('unit'),
          userId,
          semesterId: selectedSemesterId,
          subjectId,
          unitNumber: maxUnitNum,
          title: pUnit.title.trim(),
          createdAt: now,
          updatedAt: now,
        };
        newUnitsToAdd.push(targetUnit);
      }

      // Check existing topics under this unit
      const existingUnitTopics = rawTopics.filter((t) => t.unitId === targetUnit!.id);

      for (const topicTitle of pUnit.topics) {
        const cleanTopic = topicTitle.trim();
        if (!cleanTopic) continue;

        const alreadyExists =
          existingUnitTopics.some((t) => t.title.toLowerCase() === cleanTopic.toLowerCase()) ||
          newTopicsToAdd.some(
            (t) => t.unitId === targetUnit!.id && t.title.toLowerCase() === cleanTopic.toLowerCase()
          );

        if (!alreadyExists) {
          const newTopic: Topic = {
            id: generateId('topic'),
            userId,
            semesterId: selectedSemesterId,
            subjectId,
            unitId: targetUnit!.id,
            title: cleanTopic,
            isCompleted: false,
            createdAt: now,
            updatedAt: now,
          };
          newTopicsToAdd.push(newTopic);
        }
      }
    }

    // Atomic update
    if (newUnitsToAdd.length > 0) {
      setUnits((prev) => [...prev, ...newUnitsToAdd]);
    }
    if (newTopicsToAdd.length > 0) {
      setTopics((prev) => [...prev, ...newTopicsToAdd]);
    }
  }, [selectedSemesterId, userId, rawUnits, rawTopics]);

  // --- TOPIC CRUD ---
  const createTopic = useCallback((unitId: string, subjectId: string, title: string): Topic => {
    if (!selectedSemesterId) throw new Error('No semester selected.');
    const now = new Date().toISOString();
    const newTopic: Topic = {
      id: generateId('topic'),
      userId,
      semesterId: selectedSemesterId,
      subjectId,
      unitId,
      title,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    setTopics((prev) => [...prev, newTopic]);
    return newTopic;
  }, [selectedSemesterId, userId]);

  const updateTopic = useCallback((id: string, updates: Partial<Topic>) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  const deleteTopic = useCallback((id: string) => {
    const nextState = cascadeDeleteTopic(
      {
        semesters: rawSemesters,
        subjects: rawSubjects,
        units: rawUnits,
        topics: rawTopics,
        exams: rawExams,
        tasks: rawTasks,
        revisions: rawRevisions,
        resources: rawResources,
      },
      id
    );
    setTopics(nextState.topics);
    setTasks(nextState.tasks);
    setRevisions(nextState.revisions);
  }, [rawSemesters, rawSubjects, rawUnits, rawTopics, rawExams, rawTasks, rawRevisions, rawResources]);

  const toggleTopicCompletion = useCallback((id: string, isCompleted: boolean) => {
    const nowIso = new Date().toISOString();
    setTopics((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isCompleted,
              completedAt: isCompleted ? nowIso : undefined,
              updatedAt: nowIso,
            }
          : t
      )
    );
  }, []);

  // --- EXAM CRUD ---
  const createExam = useCallback((data: {
    title: string;
    examDate: string;
    subjectId?: string;
    examTime?: string;
    location?: string;
    notes?: string;
  }): Exam => {
    if (!selectedSemesterId) throw new Error('No semester selected.');
    const now = new Date().toISOString();

    // Prevent duplicate exam for same subject and same date
    if (data.subjectId) {
      const existingDup = rawExams.find(
        (e) => e.subjectId === data.subjectId && e.examDate === data.examDate
      );
      if (existingDup) return existingDup;
    }

    const newExam: Exam = {
      id: generateId('exam'),
      userId,
      semesterId: selectedSemesterId,
      subjectId: data.subjectId,
      title: data.title,
      examDate: data.examDate,
      examTime: data.examTime,
      location: data.location,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    const updatedExams = [...rawExams, newExam];
    setExams(updatedExams);

    // Reconcile revisions on newly created exam
    if (data.subjectId) {
      const subject = rawSubjects.find((s) => s.id === data.subjectId);
      const nextRevs = reconcileRevisionsOnNewExam(
        rawRevisions,
        newExam,
        rawTasks,
        updatedExams,
        subject
      );
      setRevisions(nextRevs);
    }

    return newExam;
  }, [selectedSemesterId, userId, rawExams, rawSubjects, rawRevisions, rawTasks]);

  // Phase C.6 & C.8: updateExam cleanly reconciles without nested setState
  const updateExam = useCallback((id: string, updates: Partial<Exam>) => {
    const now = new Date().toISOString();
    const targetExam = rawExams.find((e) => e.id === id);
    if (!targetExam) return;

    const updatedExam: Exam = {
      ...targetExam,
      ...updates,
      updatedAt: now,
    };

    setExams((prev) => prev.map((e) => (e.id === id ? updatedExam : e)));

    if (updates.examDate && updates.examDate !== targetExam.examDate) {
      const nextRevs = reconcileRevisionsOnExamChange(rawRevisions, updatedExam, rawTasks);
      setRevisions(nextRevs);
    }
  }, [rawExams, rawRevisions, rawTasks]);

  const deleteExam = useCallback((id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    setRevisions((prev) =>
      prev.map((r) => (r.examId === id ? { ...r, examId: undefined } : r))
    );
  }, []);

  // --- STUDY TASK CRUD ---
  const createStudyTask = useCallback((data: {
    title: string;
    subjectId: string;
    scheduledDate: string;
    estimatedMinutes?: number;
    unitId?: string;
    topicId?: string;
    notes?: string;
  }): StudyTask => {
    if (!selectedSemesterId) throw new Error('No semester selected.');
    const now = new Date().toISOString();
    const newTask: StudyTask = {
      id: generateId('task'),
      userId,
      semesterId: selectedSemesterId,
      subjectId: data.subjectId,
      unitId: data.unitId,
      topicId: data.topicId,
      title: data.title,
      scheduledDate: data.scheduledDate || getTodayString(),
      estimatedMinutes: data.estimatedMinutes || 45,
      notes: data.notes,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [...prev, newTask]);
    return newTask;
  }, [selectedSemesterId, userId]);

  const updateStudyTask = useCallback((id: string, updates: Partial<StudyTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  const deleteStudyTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setRevisions((prev) => prev.filter((r) => r.studyTaskId !== id || r.isCompleted));
  }, []);

  // Phase C.1, C.4, C.7: Complete / Uncomplete study task
  const completeStudyTask = useCallback((
    id: string,
    isCompleted: boolean,
    understanding?: 'weak' | 'okay' | 'strong'
  ) => {
    const task = rawTasks.find((t) => t.id === id);
    if (!task) return;

    if (task.isCompleted === isCompleted && (!understanding || task.understanding === understanding)) {
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedTask: StudyTask = {
      ...task,
      isCompleted,
      completedAt: isCompleted ? (task.completedAt || nowIso) : undefined,
      understanding: isCompleted ? (understanding || task.understanding || 'okay') : undefined,
      updatedAt: nowIso,
    };

    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

    if (isCompleted) {
      // Find nearest upcoming exam for subject
      const subject = rawSubjects.find((s) => s.id === task.subjectId);
      const completionDate = updatedTask.completedAt ? updatedTask.completedAt.slice(0, 10) : getTodayString();
      const nextExam = getNextExamForSubject(rawExams, subject, completionDate);
      let examDate = nextExam?.examDate || null;
      let examId = nextExam?.id || null;

      // Never store a synthetic id: create the real exam record first
      if (nextExam && nextExam.id.startsWith('synthetic_exam_')) {
        const realExam: Exam = {
          id: generateId('exam'),
          userId,
          semesterId: nextExam.semesterId,
          subjectId: nextExam.subjectId,
          title: nextExam.title,
          examDate: nextExam.examDate,
          autoCreated: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setExams((prev) => [...prev, realExam]);
        examId = realExam.id;
      }

      setRevisions((prevRevs) => {
        const newRevs = createRevisionsForTask(updatedTask, prevRevs, examDate, examId);
        return [...prevRevs, ...newRevs];
      });

      if (task.topicId) {
        toggleTopicCompletion(task.topicId, true);
      }
    } else {
      // Phase C.7: Un-completing deletes pending (not completed) revisions
      setRevisions((prevRevs) =>
        prevRevs.filter((r) => !(r.studyTaskId === id && !r.isCompleted))
      );

      // Reset topic back to incomplete if no OTHER completed task exists for that topic
      if (task.topicId) {
        const otherCompletedTask = rawTasks.some(
          (t) => t.id !== id && t.topicId === task.topicId && t.isCompleted
        );
        if (!otherCompletedTask) {
          toggleTopicCompletion(task.topicId, false);
        }
      }
    }
  }, [rawTasks, rawSubjects, rawExams, toggleTopicCompletion]);

  // --- REVISION CRUD ---
  const completeRevision = useCallback((id: string, isCompleted: boolean) => {
    setRevisions((prev) =>
      prev.map((r) => (r.id === id ? toggleRevisionCompletion(r, isCompleted) : r))
    );
  }, []);

  const deleteRevision = useCallback((id: string) => {
    setRevisions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // --- AUTOMATIC PLANNING ---
  const runAutoPlanAllExams = useCallback(() => {
    if (!selectedSemester) {
      return { count: 0, message: 'Please select a semester first.' };
    }
    const result = autoPlanAllExams(
      selectedSemester,
      subjects,
      units,
      topics,
      exams,
      tasks,
      revisions
    );

    if (result.newTasks.length > 0) {
      setTasks((prev) => [...prev, ...result.newTasks]);
    }
    return {
      count: result.newTasks.length,
      message: result.summaryMessage,
    };
  }, [selectedSemester, subjects, units, topics, exams, tasks, revisions]);

  // --- BACKUP & RESTORE ---
  const getBackupJson = useCallback((): string => {
    return exportBackup({
      semesters: rawSemesters,
      subjects: rawSubjects,
      units: rawUnits,
      topics: rawTopics,
      exams: rawExams,
      tasks: rawTasks,
      revisions: rawRevisions,
      resources: rawResources,
    });
  }, [rawSemesters, rawSubjects, rawUnits, rawTopics, rawExams, rawTasks, rawRevisions, rawResources]);

  const restoreFromJson = useCallback((jsonString: string): { success: boolean; message: string } => {
    const res = validateAndParseBackup(jsonString);
    if (!res.valid || !res.data) {
      return { success: false, message: res.error || 'Failed to restore backup.' };
    }
    setSemesters(res.data.semesters);
    setSubjects(res.data.subjects);
    setUnits(res.data.units);
    setTopics(res.data.topics);
    setExams(res.data.exams);
    setTasks(res.data.tasks);
    setRevisions(res.data.revisions);
    setResources(res.data.resources);

    if (res.data.semesters.length > 0) {
      setSelectedSemesterId(res.data.semesters[0].id);
    }
    return { success: true, message: 'Data successfully restored!' };
  }, [setSelectedSemesterId]);

  const value: PlannerContextType = {
    currentUser,
    login,
    logout,
    activeScreen,
    setActiveScreen,
    selectedSemesterId,
    setSelectedSemesterId,
    selectedSemester,
    semesters: rawSemesters,
    subjects,
    units,
    topics,
    exams,
    tasks,
    revisions,
    resources,
    dailyActivities,
    allSubjects: rawSubjects,
    allTasks: rawTasks,
    createSemester,
    updateSemester,
    deleteSemester,
    createSubject,
    updateSubject,
    deleteSubject,
    importSyllabus,
    reorderUnit,
    reorderTopic,
    createUnit,
    updateUnit,
    deleteUnit,
    createTopic,
    updateTopic,
    deleteTopic,
    toggleTopicCompletion,
    createExam,
    updateExam,
    deleteExam,
    createStudyTask,
    updateStudyTask,
    deleteStudyTask,
    completeStudyTask,
    completeRevision,
    deleteRevision,
    runAutoPlanAllExams,
    getBackupJson,
    restoreFromJson,
    isQuickAddOpen,
    setQuickAddOpen,
    isSearchOpen,
    setSearchOpen,
    isFocusSessionOpen,
    setFocusSessionOpen,
    isAssistantOpen,
    setAssistantOpen,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
