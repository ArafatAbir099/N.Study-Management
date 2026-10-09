import { StudyTask, RevisionRecord, Exam, Subject, RevisionStatus } from '../types';
import { generateId } from './id';
import {
  getTodayString,
  addDays,
  isValidDateString,
  isBefore,
  diffDays
} from './dateUtils';

export const DEFAULT_REVISION_INTERVALS = [1, 3, 7, 14, 30];

export const UNDERSTANDING_INTERVALS: Record<'weak' | 'okay' | 'strong', number[]> = {
  weak: [1, 2, 4, 7, 14, 30],
  okay: [1, 3, 7, 14, 30],
  strong: [3, 7, 21],
};

/**
 * Calculates and returns the derived status of a revision record.
 * Completed revisions are NEVER pending or overdue.
 * Future revisions are NEVER overdue.
 */
export function getRevisionStatus(
  revision: RevisionRecord,
  today: string = getTodayString()
): RevisionStatus {
  if (revision.isCompleted) {
    return 'completed';
  }
  if (revision.scheduledDate === today) {
    return 'today';
  }
  if (isBefore(revision.scheduledDate, today)) {
    return 'overdue';
  }
  return 'upcoming';
}

/**
 * Finds the nearest exam for a subject with examDate >= fromDate.
 * Falls back to subject.examDate if valid and >= fromDate.
 */
export function getNextExamForSubject(
  exams: Exam[],
  subject: Subject | undefined,
  fromDate: string
): Exam | null {
  if (!subject) return null;

  const validSubjectExams = exams
    .filter((e) => e.subjectId === subject.id && isValidDateString(e.examDate) && !isBefore(e.examDate, fromDate))
    .sort((a, b) => a.examDate.localeCompare(b.examDate));

  if (validSubjectExams.length > 0) {
    return validSubjectExams[0];
  }

  if (subject.examDate && isValidDateString(subject.examDate) && !isBefore(subject.examDate, fromDate)) {
    const existing = exams.find((e) => e.subjectId === subject.id && e.examDate === subject.examDate);
    if (existing) return existing;

    return {
      id: `synthetic_exam_${subject.id}`,
      userId: subject.userId,
      semesterId: subject.semesterId,
      subjectId: subject.id,
      title: `${subject.code || subject.name} Exam`,
      examDate: subject.examDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Generates spaced repetition revision records for a completed study task.
 * 
 * Rules:
 * - Will not create duplicate pending revisions if revisions for this studyTaskId already exist.
 * - Understanding intervals: weak [1,2,4,7,14,30], okay [1,3,7,14,30], strong [3,7,21].
 * - If an exam exists, scale/compress intervals so every revision falls strictly before the exam day,
 *   and always add one final-eve revision on (examDate - 1) when there is room.
 * - Never schedule a revision on or after the exam day.
 * - No two revisions of the same task on the same date.
 */
export function createRevisionsForTask(
  task: StudyTask,
  existingRevisions: RevisionRecord[],
  examDate?: string | null,
  examId?: string | null,
  customIntervals?: number[]
): RevisionRecord[] {
  if (!task || !task.id || !task.subjectId || !task.semesterId) {
    return [];
  }

  // Duplicate prevention: If pending revisions for this task already exist, do not recreate
  const hasExistingPending = existingRevisions.some(
    (rev) => rev.studyTaskId === task.id && !rev.isCompleted
  );
  if (hasExistingPending) {
    return [];
  }

  // Base completion date
  let completionDate = getTodayString();
  if (task.completedAt) {
    const parsed = task.completedAt.slice(0, 10);
    if (isValidDateString(parsed)) {
      completionDate = parsed;
    }
  } else if (isValidDateString(task.scheduledDate)) {
    completionDate = task.scheduledDate;
  }

  const hasExam = isValidDateString(examDate);

  // If exam has already passed or is today, cannot schedule any revision strictly before exam day
  if (hasExam && !isBefore(completionDate, examDate!)) {
    return [];
  }

  // Determine base intervals
  const baseIntervals = customIntervals && customIntervals.length > 0
    ? customIntervals
    : UNDERSTANDING_INTERVALS[task.understanding || 'okay'];

  let intervalsToUse: number[] = [];

  if (hasExam) {
    const daysUntilExam = diffDays(examDate!, completionDate);
    // If daysUntilExam <= 1 (e.g. exam is tomorrow or today), no days exist strictly before exam day
    if (daysUntilExam <= 1) {
      return [];
    }

    // Filter base intervals that fall strictly before the exam day
    const validBaseIntervals = baseIntervals.filter((i) => i < daysUntilExam && i > 0);

    // Final-eve revision on (examDate - 1)
    const finalEveInterval = daysUntilExam - 1;

    const uniqueSet = new Set<number>(validBaseIntervals);
    if (finalEveInterval > 0) {
      uniqueSet.add(finalEveInterval);
    }

    intervalsToUse = Array.from(uniqueSet).sort((a, b) => a - b);
  } else {
    intervalsToUse = [...baseIntervals];
  }

  const existingDates = new Set(
    existingRevisions.filter((r) => r.studyTaskId === task.id).map((r) => r.scheduledDate)
  );

  const newRevisions: RevisionRecord[] = [];
  let revNumber = existingRevisions.filter((r) => r.studyTaskId === task.id).length + 1;

  for (const interval of intervalsToUse) {
    const candidateDate = addDays(completionDate, interval);

    // Strictly enforce: NEVER schedule on or after exam date
    if (hasExam && !isBefore(candidateDate, examDate!)) {
      continue;
    }

    // Avoid duplicate dates for this task
    if (existingDates.has(candidateDate)) {
      continue;
    }

    existingDates.add(candidateDate);
    const nowIso = new Date().toISOString();

    newRevisions.push({
      id: generateId('rev'),
      userId: task.userId,
      semesterId: task.semesterId,
      subjectId: task.subjectId,
      unitId: task.unitId,
      topicId: task.topicId,
      studyTaskId: task.id,
      examId: examId || undefined,
      revisionNumber: revNumber++,
      title: `Rev ${revNumber - 1}: ${task.title}`,
      scheduledDate: candidateDate,
      isCompleted: false,
      completedAt: undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return newRevisions;
}

/**
 * Handles changes to an exam date by reconciling linked revisions.
 * 
 * Rules:
 * - Keep completed revisions untouched.
 * - Delete pending revisions of affected tasks (linked by examId).
 * - Regenerate pending revisions with createRevisionsForTask using the new exam date.
 * - Link only by examId.
 */
export function reconcileRevisionsOnExamChange(
  revisions: RevisionRecord[],
  exam: Exam,
  tasks?: StudyTask[]
): RevisionRecord[] {
  if (!exam || !isValidDateString(exam.examDate)) {
    return revisions;
  }

  // Revisions linked to this exam by examId only
  const keptRevisions: RevisionRecord[] = [];
  const affectedTaskIds = new Set<string>();

  for (const rev of revisions) {
    if (rev.examId === exam.id) {
      if (rev.isCompleted) {
        keptRevisions.push(rev);
      } else {
        affectedTaskIds.add(rev.studyTaskId);
      }
    } else {
      keptRevisions.push(rev);
    }
  }

  const regeneratedRevisions: RevisionRecord[] = [];

  for (const taskId of affectedTaskIds) {
    const task = tasks?.find((t) => t.id === taskId);
    if (task) {
      const newRevs = createRevisionsForTask(
        task,
        keptRevisions,
        exam.examDate,
        exam.id
      );
      regeneratedRevisions.push(...newRevs);
    }
  }

  return [...keptRevisions, ...regeneratedRevisions];
}

/**
 * Reconciles revisions when an exam is created for a subject after tasks were completed.
 * For completed tasks of that subject whose pending revisions have no examId or point to a different/later exam:
 * - Delete those pending revisions.
 * - Regenerate them with createRevisionsForTask against this exam (uses getNextExamForSubject).
 * - Keep completed revisions untouched.
 * - Ensure no duplicate revisions on the same date.
 */
export function reconcileRevisionsOnNewExam(
  revisions: RevisionRecord[],
  newExam: Exam,
  tasks: StudyTask[],
  allExams: Exam[],
  subject?: Subject
): RevisionRecord[] {
  if (!newExam || !newExam.subjectId) {
    return revisions;
  }

  const completedTasks = tasks.filter(
    (t) => t.subjectId === newExam.subjectId && t.isCompleted
  );

  let currentRevisions = [...revisions];

  for (const task of completedTasks) {
    const taskPendingRevs = currentRevisions.filter(
      (r) => r.studyTaskId === task.id && !r.isCompleted
    );

    if (taskPendingRevs.length === 0) {
      continue;
    }

    const completionDate = task.completedAt
      ? task.completedAt.slice(0, 10)
      : (task.scheduledDate || getTodayString());

    const nearestExam = getNextExamForSubject(allExams, subject, completionDate);
    if (!nearestExam) {
      continue;
    }

    // Qualifies if pending revisions have no examId or point to a different/later exam
    const shouldReconcile = taskPendingRevs.some((r) => {
      if (!r.examId) return true;
      if (r.examId !== nearestExam.id) return true;
      const linkedExam = allExams.find((e) => e.id === r.examId);
      if (linkedExam && isBefore(nearestExam.examDate, linkedExam.examDate)) return true;
      return false;
    });

    if (shouldReconcile) {
      // Delete pending revisions for this task, keep completed revisions
      currentRevisions = currentRevisions.filter(
        (r) => !(r.studyTaskId === task.id && !r.isCompleted)
      );

      // Regenerate against nearestExam
      const newRevs = createRevisionsForTask(
        task,
        currentRevisions,
        nearestExam.examDate,
        nearestExam.id
      );
      currentRevisions.push(...newRevs);
    }
  }

  return currentRevisions;
}

/**
 * Marks a revision as completed or uncompleted.
 * Idempotent: Does not produce duplicates or corrupt counts.
 */
export function toggleRevisionCompletion(
  revision: RevisionRecord,
  isComplete: boolean
): RevisionRecord {
  if (revision.isCompleted === isComplete) {
    return revision;
  }
  const nowIso = new Date().toISOString();
  return {
    ...revision,
    isCompleted: isComplete,
    completedAt: isComplete ? nowIso : undefined,
    updatedAt: nowIso,
  };
}

/**
 * Filters out pending revisions for deleted tasks/subjects.
 * Prevents broken references or orphaned revisions in the system.
 */
export function pruneOrphanedRevisions(
  revisions: RevisionRecord[],
  validTaskIds: Set<string>,
  validSubjectIds: Set<string>
): RevisionRecord[] {
  return revisions.filter((rev) => {
    if (rev.isCompleted) {
      return validSubjectIds.has(rev.subjectId);
    }
    return validTaskIds.has(rev.studyTaskId) && validSubjectIds.has(rev.subjectId);
  });
}
