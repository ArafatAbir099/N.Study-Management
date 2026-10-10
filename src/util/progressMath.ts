import { Subject, Unit, StudyTask, RevisionRecord, Exam, Topic } from '../types';
import { getTodayString } from './dateUtils';
import { getRevisionStatus } from './revisionLifecycle';

export interface ChapterStudyStats {
  chapterId: string;
  chapterTitle: string;
  subjectId: string;
  unitNumber?: number;
  isStudied: boolean;
  studySessions: number;
  studyMinutes: number;
  revisionSessions: number;
  revisionMinutes: number;
  revisions: Array<{
    id: string;
    title: string;
    revisionNumber: number;
    scheduledDate: string;
    completedAt?: string;
    isCompleted: boolean;
    status: 'completed' | 'today' | 'overdue' | 'upcoming';
  }>;
}

export interface SubjectCoverageDetail {
  subject: Subject;
  totalChapters: number;
  studiedChapters: number;
  percentage: number | null;
  totalStudySessions: number;
  totalStudyMinutes: number;
  totalRevisionSessions: number;
  totalRevisionMinutes: number;
  chapters: ChapterStudyStats[];
}

export interface SyllabusCoverageResult {
  totalChapters: number;
  studiedChapters: number;
  percentage: number | null;
  isEmpty: boolean;
  label: string;
  subjectDetails: SubjectCoverageDetail[];
}

export interface MasteryScoreResult {
  strong: number;
  okay: number;
  weak: number;
  totalRated: number;
  percentage: number | null;
  isEmpty: boolean;
  label: string;
}

export interface RevisionRetentionResult {
  completed: number;
  total: number;
  percentage: number | null;
  isEmpty: boolean;
  label: string;
  chaptersBreakdown: Array<{
    chapter: Unit;
    subject?: Subject;
    doneCount: number;
    todayCount: number;
    overdueCount: number;
    upcomingCount: number;
    revisions: Array<{
      id: string;
      title: string;
      revisionNumber: number;
      scheduledDate: string;
      completedAt?: string;
      isCompleted: boolean;
      status: 'completed' | 'today' | 'overdue' | 'upcoming';
    }>;
  }>;
}

export interface ExamReadinessResult {
  exam: Exam | null;
  subject: Subject | null;
  percentage: number | null;
  isEmpty: boolean;
  status: 'ready' | 'no_exam' | 'no_chapters';
  label: string;
  studiedChaptersCount: number;
  totalChaptersCount: number;
  completedRevsCount: number;
  totalRevsCount: number;
}

export interface ChapterNeedingReinforcement {
  chapter: Unit;
  subject?: Subject;
  reasons: string[];
  weakCount: number;
  overdueCount: number;
}

/**
 * Returns whether a chapter is studied and its exact study & revision statistics.
 */
export function getChapterStudyStats(
  chapter: Unit,
  tasks: StudyTask[],
  revisions: RevisionRecord[],
  topics: Topic[] = [],
  today: string = getTodayString()
): ChapterStudyStats {
  // Find topics that belonged to this chapter for backwards compatibility
  const chapterTopicIds = new Set(topics.filter((t) => t.unitId === chapter.id).map((t) => t.id));

  const isTaskForChapter = (t: StudyTask) =>
    t.unitId === chapter.id || (t.topicId ? chapterTopicIds.has(t.topicId) : false);

  // Completed normal study tasks (first-time study)
  const completedStudyTasks = tasks.filter(
    (t) => isTaskForChapter(t) && t.isCompleted && t.taskType !== 'revision'
  );

  // Completed revision tasks
  const completedRevisionTasks = tasks.filter(
    (t) => isTaskForChapter(t) && t.isCompleted && t.taskType === 'revision'
  );

  const studyMinutes = completedStudyTasks.reduce(
    (acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 45),
    0
  );

  const isRevisionForChapter = (r: RevisionRecord) => {
    if (r.unitId === chapter.id) return true;
    if (r.topicId && chapterTopicIds.has(r.topicId)) return true;
    const originatingTask = tasks.find((t) => t.id === r.studyTaskId);
    if (originatingTask && isTaskForChapter(originatingTask)) return true;
    return false;
  };

  const chapterRevisions = revisions.filter(isRevisionForChapter);
  const completedChapterRevisions = chapterRevisions.filter((r) => r.isCompleted);

  const revisionMinutesFromTasks = completedRevisionTasks.reduce(
    (acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 30),
    0
  );
  // Default completed revision records to 20 mins if not tracked via task
  const revisionMinutesFromRecords = completedChapterRevisions.length * 20;

  const revisionSessions = completedRevisionTasks.length + completedChapterRevisions.length;
  const revisionMinutes = revisionMinutesFromTasks + revisionMinutesFromRecords;

  const isStudied = completedStudyTasks.length > 0;

  const formattedRevisions = chapterRevisions.map((r) => ({
    id: r.id,
    title: r.title,
    revisionNumber: r.revisionNumber,
    scheduledDate: r.scheduledDate,
    completedAt: r.completedAt,
    isCompleted: r.isCompleted,
    status: getRevisionStatus(r, today),
  }));

  // Sort revisions: overdue first, today, upcoming, completed
  formattedRevisions.sort((a, b) => {
    const order = { overdue: 0, today: 1, upcoming: 2, completed: 3 };
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    return a.scheduledDate.localeCompare(b.scheduledDate);
  });

  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    subjectId: chapter.subjectId,
    unitNumber: chapter.unitNumber,
    isStudied,
    studySessions: completedStudyTasks.length,
    studyMinutes,
    revisionSessions,
    revisionMinutes,
    revisions: formattedRevisions,
  };
}

/**
 * Calculates Syllabus Coverage:
 * chapters/units finished (or studied) ÷ total chapters
 */
export function calculateSyllabusCoverage(
  subjects: Subject[],
  chapters: Unit[],
  tasks: StudyTask[],
  revisions: RevisionRecord[],
  topics: Topic[] = [],
  today: string = getTodayString()
): SyllabusCoverageResult {
  if (chapters.length === 0) {
    return {
      totalChapters: 0,
      studiedChapters: 0,
      percentage: null,
      isEmpty: true,
      label: 'No chapters yet',
      subjectDetails: [],
    };
  }

  const subjectDetails: SubjectCoverageDetail[] = subjects.map((sub) => {
    const subChapters = chapters.filter((c) => c.subjectId === sub.id);
    const chapterStats = subChapters.map((c) =>
      getChapterStudyStats(c, tasks, revisions, topics, today)
    );

    const studiedCount = chapterStats.filter((cs) => cs.isStudied).length;
    const totalCount = subChapters.length;
    const pct = totalCount > 0 ? Math.round((studiedCount / totalCount) * 100) : null;

    const totalStudySessions = chapterStats.reduce((acc, cs) => acc + cs.studySessions, 0);
    const totalStudyMinutes = chapterStats.reduce((acc, cs) => acc + cs.studyMinutes, 0);
    const totalRevisionSessions = chapterStats.reduce((acc, cs) => acc + cs.revisionSessions, 0);
    const totalRevisionMinutes = chapterStats.reduce((acc, cs) => acc + cs.revisionMinutes, 0);

    return {
      subject: sub,
      totalChapters: totalCount,
      studiedChapters: studiedCount,
      percentage: pct,
      totalStudySessions,
      totalStudyMinutes,
      totalRevisionSessions,
      totalRevisionMinutes,
      chapters: chapterStats,
    };
  });

  let totalStudied = 0;
  for (const sd of subjectDetails) {
    totalStudied += sd.studiedChapters;
  }

  const overallPct = Math.round((totalStudied / chapters.length) * 100);

  return {
    totalChapters: chapters.length,
    studiedChapters: totalStudied,
    percentage: overallPct,
    isEmpty: false,
    label: `${overallPct}% (${totalStudied}/${chapters.length} chapters)`,
    subjectDetails,
  };
}

/**
 * Calculates Mastery Score:
 * Based on the understanding rating chosen after completed study tasks (strong, okay, weak)
 */
export function calculateMasteryScore(tasks: StudyTask[]): MasteryScoreResult {
  const completedTasks = tasks.filter((t) => t.isCompleted && Boolean(t.understanding));

  let strong = 0;
  let okay = 0;
  let weak = 0;

  for (const t of completedTasks) {
    if (t.understanding === 'strong') strong++;
    else if (t.understanding === 'okay') okay++;
    else if (t.understanding === 'weak') weak++;
  }

  const totalRated = strong + okay + weak;

  if (totalRated === 0) {
    return {
      strong: 0,
      okay: 0,
      weak: 0,
      totalRated: 0,
      percentage: null,
      isEmpty: true,
      label: 'No ratings yet',
    };
  }

  // Weighted average: strong = 1.0 (100%), okay = 0.7 (70%), weak = 0.3 (30%)
  const rawScore = (strong * 1.0 + okay * 0.7 + weak * 0.3) / totalRated;
  const percentage = Math.round(rawScore * 100);

  return {
    strong,
    okay,
    weak,
    totalRated,
    percentage,
    isEmpty: false,
    label: `${percentage}%`,
  };
}

/**
 * Calculates Revision Retention:
 * completed revisions ÷ scheduled revisions (not hardcoded 9)
 */
export function calculateRevisionRetention(
  chapters: Unit[],
  subjects: Subject[],
  revisions: RevisionRecord[],
  tasks: StudyTask[] = [],
  topics: Topic[] = [],
  today: string = getTodayString()
): RevisionRetentionResult {
  // Standalone revision tasks for chapters that have no scheduled RevisionRecord
  const chaptersWithScheduledRevs = new Set(revisions.map((r) => r.unitId).filter(Boolean));
  const standaloneRevisionTasks = tasks.filter(
    (t) => t.taskType === 'revision' && t.unitId && !chaptersWithScheduledRevs.has(t.unitId)
  );
  const completedStandaloneTasks = standaloneRevisionTasks.filter((t) => t.isCompleted);

  const completedRecordCount = revisions.filter((r) => r.isCompleted).length;
  const totalRevsScheduled = revisions.length + standaloneRevisionTasks.length;
  const totalRevsCompleted = completedRecordCount + completedStandaloneTasks.length;

  const chaptersBreakdown = chapters.map((chap) => {
    const sub = subjects.find((s) => s.id === chap.subjectId);
    const stats = getChapterStudyStats(chap, tasks, revisions, topics, today);

    const doneCount = stats.revisions.filter((r) => r.isCompleted).length;
    const todayCount = stats.revisions.filter((r) => r.status === 'today').length;
    const overdueCount = stats.revisions.filter((r) => r.status === 'overdue').length;
    const upcomingCount = stats.revisions.filter((r) => r.status === 'upcoming').length;

    return {
      chapter: chap,
      subject: sub,
      doneCount,
      todayCount,
      overdueCount,
      upcomingCount,
      revisions: stats.revisions,
    };
  });

  if (totalRevsScheduled === 0) {
    return {
      completed: 0,
      total: 0,
      percentage: null,
      isEmpty: true,
      label: 'No revisions scheduled',
      chaptersBreakdown,
    };
  }

  const percentage = Math.round((totalRevsCompleted / totalRevsScheduled) * 100);

  return {
    completed: totalRevsCompleted,
    total: totalRevsScheduled,
    percentage,
    isEmpty: false,
    label: `${percentage}% (${totalRevsCompleted}/${totalRevsScheduled})`,
    chaptersBreakdown,
  };
}

/**
 * Calculates Exam Readiness:
 * Studied chapters + completed revisions for the exam's subject.
 * If no exam exists in the semester, returns "No exam added" instead of 0%.
 */
export function calculateExamReadiness(
  exams: Exam[],
  subjects: Subject[],
  chapters: Unit[],
  tasks: StudyTask[],
  revisions: RevisionRecord[],
  selectedExamId?: string | null,
  topics: Topic[] = [],
  today: string = getTodayString()
): ExamReadinessResult {
  if (exams.length === 0) {
    return {
      exam: null,
      subject: null,
      percentage: null,
      isEmpty: true,
      status: 'no_exam',
      label: 'No exam added',
      studiedChaptersCount: 0,
      totalChaptersCount: 0,
      completedRevsCount: 0,
      totalRevsCount: 0,
    };
  }

  // Pick target exam: preferred selectedExamId, or closest future/today exam, or first exam
  let targetExam = exams.find((e) => e.id === selectedExamId);
  if (!targetExam) {
    const futureOrToday = exams
      .filter((e) => e.examDate >= today)
      .sort((a, b) => a.examDate.localeCompare(b.examDate));
    targetExam = futureOrToday[0] || exams[0];
  }

  const subject = subjects.find((s) => s.id === targetExam.subjectId) || null;
  const subjectChapters = subject ? chapters.filter((c) => c.subjectId === subject.id) : [];

  if (subjectChapters.length === 0) {
    return {
      exam: targetExam,
      subject,
      percentage: null,
      isEmpty: true,
      status: 'no_chapters',
      label: 'No chapters added',
      studiedChaptersCount: 0,
      totalChaptersCount: 0,
      completedRevsCount: 0,
      totalRevsCount: 0,
    };
  }

  const chapterStats = subjectChapters.map((c) =>
    getChapterStudyStats(c, tasks, revisions, topics, today)
  );

  const studiedChaptersCount = chapterStats.filter((cs) => cs.isStudied).length;
  const totalChaptersCount = subjectChapters.length;
  const coverageRatio = studiedChaptersCount / totalChaptersCount;

  const subjectRevisions = revisions.filter((r) => r.subjectId === targetExam!.subjectId);
  const completedRevsCount = subjectRevisions.filter((r) => r.isCompleted).length;
  const totalRevsCount = subjectRevisions.length;

  let revisionRatio = 0;
  if (totalRevsCount > 0) {
    revisionRatio = completedRevsCount / totalRevsCount;
  } else if (studiedChaptersCount > 0) {
    // If chapters are studied but revisions haven't come due yet, give 50% baseline
    revisionRatio = 0.5;
  }

  // Weight: 60% coverage, 40% revisions completed
  const percentage = Math.min(100, Math.round((coverageRatio * 0.6 + revisionRatio * 0.4) * 100));

  return {
    exam: targetExam,
    subject,
    percentage,
    isEmpty: false,
    status: 'ready',
    label: `${percentage}%`,
    studiedChaptersCount,
    totalChaptersCount,
    completedRevsCount,
    totalRevsCount,
  };
}

/**
 * Lists chapters with weak understanding or overdue revisions.
 */
export function getChaptersNeedingReinforcement(
  chapters: Unit[],
  subjects: Subject[],
  tasks: StudyTask[],
  revisions: RevisionRecord[],
  topics: Topic[] = [],
  today: string = getTodayString()
): ChapterNeedingReinforcement[] {
  const result: ChapterNeedingReinforcement[] = [];

  for (const chap of chapters) {
    const stats = getChapterStudyStats(chap, tasks, revisions, topics, today);
    const sub = subjects.find((s) => s.id === chap.subjectId);

    // Check for weak understanding tasks
    const chapterTopicIds = new Set(topics.filter((t) => t.unitId === chap.id).map((t) => t.id));
    const chapTasks = tasks.filter(
      (t) =>
        (t.unitId === chap.id || (t.topicId ? chapterTopicIds.has(t.topicId) : false)) &&
        t.isCompleted
    );
    const weakTasks = chapTasks.filter((t) => t.understanding === 'weak');
    const overdueRevs = stats.revisions.filter((r) => r.status === 'overdue');

    const reasons: string[] = [];
    if (weakTasks.length > 0) {
      reasons.push(`${weakTasks.length} task with weak understanding`);
    }
    if (overdueRevs.length > 0) {
      reasons.push(`${overdueRevs.length} overdue revision`);
    }

    if (reasons.length > 0) {
      result.push({
        chapter: chap,
        subject: sub,
        reasons,
        weakCount: weakTasks.length,
        overdueCount: overdueRevs.length,
      });
    }
  }

  return result;
}
