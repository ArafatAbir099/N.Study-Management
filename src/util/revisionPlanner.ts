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

    // Active uncompleted unit tasks
    const activePendingUnitIds = new Set(
      existingTasks
        .filter((t) => !t.isCompleted && t.unitId)
        .map((t) => t.unitId as string)
    );
    const studiedUnitIds = new Set(
      existingTasks
        .filter((t) => t.isCompleted && t.unitId && t.taskType !== 'revision')
        .map((t) => t.unitId as string)
    );

    const pendingTopics = topics.filter(
      (t) =>
        unitIdSet.has(t.unitId) &&
        !t.isCompleted &&
        !activePendingTaskTopicIds.has(t.id)
    );

    // If no topics exist, plan unstudied chapters (units)
    const itemsToPlan: Array<{ unitId: string; topicId?: string; title: string }> = [];

    if (pendingTopics.length > 0) {
      for (const t of pendingTopics) {
        itemsToPlan.push({ unitId: t.unitId, topicId: t.id, title: t.title });
      }
    } else {
      const pendingUnits = subjectUnits.filter(
        (u) => !studiedUnitIds.has(u.id) && !activePendingUnitIds.has(u.id)
      );
      for (const u of pendingUnits) {
        itemsToPlan.push({ unitId: u.id, title: u.title });
      }
    }

    if (itemsToPlan.length === 0) continue;

    // Study buffer: up to (examDate - 3 days)
    let lastStudyDate = addDays(exam.examDate, -3);
    if (isBefore(lastStudyDate, today)) {
      // If exam is in fewer than 3 days, study until eve of exam or today
      lastStudyDate = isBefore(today, exam.examDate) ? addDays(exam.examDate, -1) : today;
    }

    const availableDaysCount = Math.max(1, diffDays(lastStudyDate, today) + 1);
    const maxComfortableItems = availableDaysCount * 3;

    let itemsPerDay = 1;

    if (itemsToPlan.length > maxComfortableItems) {
      itemsPerDay = Math.ceil(itemsToPlan.length / availableDaysCount);
      warnings.push(
        `High workload warning for ${subject.code || subject.name}: ${itemsToPlan.length} chapters scheduled across ${availableDaysCount} day(s) before exam (${itemsPerDay}/day).`
      );
    } else {
      // Distribute evenly with max 3 per day
      itemsPerDay = Math.min(3, Math.max(1, Math.ceil(itemsToPlan.length / availableDaysCount)));
    }

    let currentDayIndex = 0;
    let scheduledOnCurrentDay = 0;

    for (const item of itemsToPlan) {
      if (scheduledOnCurrentDay >= itemsPerDay && currentDayIndex < availableDaysCount - 1) {
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
        unitId: item.unitId,
        topicId: item.topicId,
        taskType: 'study',
        title: `Study: ${item.title}`,
        scheduledDate,
        estimatedMinutes: 45,
        isCompleted: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      createdTasks.push(newTask);
      if (item.topicId) {
        activePendingTaskTopicIds.add(item.topicId);
      }
      activePendingUnitIds.add(item.unitId);
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
