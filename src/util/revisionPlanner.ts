import { Semester, Subject, Unit, Topic, Exam, StudyTask, RevisionRecord } from '../types';
import { generateId } from './id';
import { getTodayString, addDays, isValidDateString, isBefore, diffDays } from './dateUtils';

export interface AutoPlanResult {
  newTasks: StudyTask[];
  newRevisions: RevisionRecord[];
  summaryMessage: string;
}

/**
 * Automatically plans daily study tasks leading up to upcoming exams for uncompleted topics.
 * 
 * Rules:
 * - Only use exams of the selected semester.
 * - Skip exams without subjectId.
 * - Exact subjectId match only (subjects.find(s => s.id === exam.subjectId && s.semesterId === semester.id)).
 * - Distribute pending topics evenly from today to (examDate - 3 days) as a revision buffer.
 * - Max 3 tasks per subject per day when they fit.
 * - If topics do not fit, schedule several per day and return a clear warning message instead of silently dropping topics.
 * - Do not count completed tasks as "already scheduled".
 */
export function autoPlanAllExams(
  semester: Semester,
  subjects: Subject[],
  units: Unit[],
  topics: Topic[],
  exams: Exam[],
  existingTasks: StudyTask[],
  _existingRevisions: RevisionRecord[]
): AutoPlanResult {
  const today = getTodayString();
  const createdTasks: StudyTask[] = [];

  // Active uncompleted tasks index: do NOT count completed tasks as already scheduled
  const activePendingTaskTopicIds = new Set(
    existingTasks
      .filter((t) => !t.isCompleted && t.topicId)
      .map((t) => t.topicId as string)
  );

  // Filter exams: only selected semester, must have subjectId, must be today or future
  const upcomingExams = exams.filter(
    (e) =>
      e.semesterId === semester.id &&
      Boolean(e.subjectId) &&
      isValidDateString(e.examDate) &&
      !isBefore(e.examDate, today)
  );

  if (upcomingExams.length === 0) {
    return {
      newTasks: [],
      newRevisions: [],
      summaryMessage: 'No upcoming exams found to plan for in this semester.',
    };
  }

  let totalPlannedTopics = 0;
  const warnings: string[] = [];

  for (const exam of upcomingExams) {
    // Exact subject match only
    const subject = subjects.find(
      (s) => s.id === exam.subjectId && s.semesterId === semester.id
    );
    if (!subject) continue;

    // Find units and uncompleted topics not currently scheduled
    const subjectUnits = units.filter((u) => u.subjectId === subject.id);
    const unitIdSet = new Set(subjectUnits.map((u) => u.id));

    const pendingTopics = topics.filter(
      (t) =>
        unitIdSet.has(t.unitId) &&
        !t.isCompleted &&
        !activePendingTaskTopicIds.has(t.id)
    );

    if (pendingTopics.length === 0) continue;

    // Study buffer: up to (examDate - 3 days)
    let lastStudyDate = addDays(exam.examDate, -3);
    if (isBefore(lastStudyDate, today)) {
      // If exam is in fewer than 3 days, study until eve of exam or today
      lastStudyDate = isBefore(today, exam.examDate) ? addDays(exam.examDate, -1) : today;
    }

    const availableDaysCount = Math.max(1, diffDays(lastStudyDate, today) + 1);
    const maxComfortableTopics = availableDaysCount * 3;

    let topicsPerDay = 1;
    let isCramming = false;

    if (pendingTopics.length > maxComfortableTopics) {
      isCramming = true;
      topicsPerDay = Math.ceil(pendingTopics.length / availableDaysCount);
      warnings.push(
        `High workload warning for ${subject.code || subject.name}: ${pendingTopics.length} topics scheduled across ${availableDaysCount} day(s) before exam (${topicsPerDay} topics/day).`
      );
    } else {
      // Distribute evenly with max 3 per day
      topicsPerDay = Math.min(3, Math.max(1, Math.ceil(pendingTopics.length / availableDaysCount)));
    }

    let currentDayIndex = 0;
    let scheduledOnCurrentDay = 0;

    for (const topic of pendingTopics) {
      if (scheduledOnCurrentDay >= topicsPerDay && currentDayIndex < availableDaysCount - 1) {
        currentDayIndex++;
        scheduledOnCurrentDay = 0;
      }

      const scheduledDate = addDays(today, currentDayIndex);
      const nowIso = new Date().toISOString();

      const newTask: StudyTask = {
        id: generateId('task'),
        userId: semester.userId,
        semesterId: semester.id,
        subjectId: subject.id,
        unitId: topic.unitId,
        topicId: topic.id,
        title: `Study: ${topic.title}`,
        scheduledDate,
        estimatedMinutes: 45,
        isCompleted: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      createdTasks.push(newTask);
      activePendingTaskTopicIds.add(topic.id);
      scheduledOnCurrentDay++;
      totalPlannedTopics++;
    }
  }

  let summary = '';
  if (totalPlannedTopics > 0) {
    summary = `Successfully scheduled ${totalPlannedTopics} study task${totalPlannedTopics === 1 ? '' : 's'}.`;
    if (warnings.length > 0) {
      summary += ` ${warnings.join(' ')}`;
    }
  } else {
    summary = 'All topics are already scheduled or completed.';
  }

  return {
    newTasks: createdTasks,
    newRevisions: [],
    summaryMessage: summary,
  };
}
