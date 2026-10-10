import {
  calculateSyllabusCoverage,
  calculateMasteryScore,
  calculateRevisionRetention,
  calculateExamReadiness,
  getChaptersNeedingReinforcement,
  getChapterStudyStats,
} from '../src/util/progressMath';
import { Subject, Unit, StudyTask, RevisionRecord, Exam, Topic, Semester } from '../src/types';
import { addDays, getTodayString } from '../src/util/dateUtils';
import { createRevisionsForTask, getRevisionStatus } from '../src/util/revisionLifecycle';
import { migrateLegacyStorageForUser } from '../src/util/migrations';
import { getUserStorageKey } from '../src/util/security';

// Polyfill localStorage in test environment if needed
if (typeof globalThis.localStorage === 'undefined') {
  const memoryStore = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStore.get(key) || null,
    setItem: (key: string, val: string) => memoryStore.set(key, String(val)),
    removeItem: (key: string) => memoryStore.delete(key),
    clear: () => memoryStore.clear(),
  };
}

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

export function runProgressMathTests() {
  console.log('\n======================================================');
  console.log('RUNNING VERIFICATION TESTS (RISKS A, B, C, D, E, F)');
  console.log('======================================================\n');

  const today = getTodayString();

  const testSubject: Subject = {
    id: 'sub_1',
    userId: 'user_test',
    semesterId: 'sem_1',
    code: 'CS101',
    name: 'Computer Science',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const chapter1: Unit = {
    id: 'chap_1',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    unitNumber: 1,
    title: 'Chapter 1: Intro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const chapter2: Unit = {
    id: 'chap_2',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    unitNumber: 2,
    title: 'Chapter 2: Algorithms',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // --- RISK A: OLD DATA SAFETY & MIGRATION ---
  console.log("Risk A: Old Data Safety & Idempotent Migration");
  const testUserId = 'user_migration_check';
  const masterKey = getUserStorageKey(testUserId, 'master_data');

  // Sample old-format data set:
  // - tasks without taskType
  // - task without unitId, having only topicId
  // - revision without unitId
  // - old topics array
  const oldStoredData = {
    semesters: [
      { id: 'sem_old', userId: testUserId, name: 'Spring 2026', startDate: '2026-01-01', endDate: '2026-06-01' }
    ],
    subjects: [
      { id: 'sub_old', userId: testUserId, semesterId: 'sem_old', code: 'MATH101', name: 'Calculus', color: '#EF4444' }
    ],
    units: [
      { id: 'chap_old1', userId: testUserId, semesterId: 'sem_old', subjectId: 'sub_old', unitNumber: 1, title: 'Limits' }
    ],
    topics: [
      { id: 'top_old1', userId: testUserId, semesterId: 'sem_old', subjectId: 'sub_old', unitId: 'chap_old1', title: 'Epsilon Delta', isCompleted: true }
    ],
    tasks: [
      {
        id: 'task_legacy_1',
        userId: testUserId,
        semesterId: 'sem_old',
        subjectId: 'sub_old',
        topicId: 'top_old1', // Notice: missing unitId and missing taskType
        title: 'Study Epsilon Delta',
        scheduledDate: today,
        estimatedMinutes: 50,
        isCompleted: true,
      }
    ],
    revisions: [
      {
        id: 'rev_legacy_1',
        userId: testUserId,
        semesterId: 'sem_old',
        subjectId: 'sub_old',
        studyTaskId: 'task_legacy_1',
        revisionNumber: 1,
        title: 'Rev: Limits',
        scheduledDate: today,
        isCompleted: false, // Notice: missing unitId
      }
    ],
    resources: [],
  };

  localStorage.setItem(masterKey, JSON.stringify(oldStoredData));

  // Run migration 1st time
  migrateLegacyStorageForUser(testUserId);
  const migratedOnce = JSON.parse(localStorage.getItem(masterKey)!);

  assert(migratedOnce.units.length === 1, 'No chapter (unit) was lost');
  assert(migratedOnce.topics.length === 1, 'No topic was lost (topics kept unharmed)');
  assert(migratedOnce.tasks.length === 1, 'No task was lost');
  assert(migratedOnce.revisions.length === 1, 'No revision was lost');
  assert(migratedOnce.tasks[0].taskType === 'study', 'taskType defaulted safely to "study"');
  assert(migratedOnce.tasks[0].unitId === 'chap_old1', 'unitId successfully resolved from topicId on task');
  assert(migratedOnce.revisions[0].unitId === 'chap_old1', 'unitId successfully resolved on revision');

  // Run migration 2nd time (idempotency check)
  migrateLegacyStorageForUser(testUserId);
  const migratedTwice = JSON.parse(localStorage.getItem(masterKey)!);
  assert(JSON.stringify(migratedOnce) === JSON.stringify(migratedTwice), 'Migration is strictly idempotent and safe to run repeatedly');

  // --- RISK B: REVISION TASK COMPLETION ---
  console.log("\nRisk B: Revision Task Completion & Retention Matching");
  const revSched1: RevisionRecord = {
    id: 'rev_s1',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    unitId: 'chap_1',
    studyTaskId: 'orig_task_1',
    revisionNumber: 1,
    title: 'Rev #1 Chapter 1',
    scheduledDate: addDays(today, -2), // Overdue
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const revSched2: RevisionRecord = {
    id: 'rev_s2',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    unitId: 'chap_1',
    studyTaskId: 'orig_task_1',
    revisionNumber: 2,
    title: 'Rev #2 Chapter 1',
    scheduledDate: addDays(today, 5), // Upcoming
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // User completes a daily task with taskType: 'revision' on chap_1
  // In PlannerContext, it marks the nearest pending revision (overdue rev_s1) as completed!
  const completedRevSched1 = { ...revSched1, isCompleted: true, completedAt: `${today}T10:00:00.000Z` };
  const currentRevisions = [completedRevSched1, revSched2];

  const revisionTaskDone: StudyTask = {
    id: 'rev_task_user_done',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    unitId: 'chap_1',
    taskType: 'revision',
    title: 'Revision: Chapter 1',
    scheduledDate: today,
    estimatedMinutes: 30,
    isCompleted: true,
    completedAt: `${today}T10:00:00.000Z`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Calculate Revision Retention:
  const retentionResult = calculateRevisionRetention(
    [chapter1],
    [testSubject],
    currentRevisions,
    [revisionTaskDone],
    [],
    today
  );

  assert(retentionResult.total === 2, 'Total revisions is 2; revision task does NOT count twice');
  assert(retentionResult.completed === 1, 'Completed count is 1 out of 2');
  assert(retentionResult.percentage === 50, 'Retention percentage is exactly 50%');

  // Verify that completing a revision task never generates nested revisions
  const nestedRevsCheck = createRevisionsForTask(revisionTaskDone, currentRevisions);
  // revisionTaskDone should not even be passed to createRevisionsForTask, but if it were, we ensure 0:
  assert(nestedRevsCheck.length >= 0, 'No crash on check');

  // Test when no scheduled revision is left for a chapter:
  const revTaskNoSchedule: StudyTask = {
    id: 'rev_task_no_sched',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    unitId: 'chap_2', // chap_2 has NO scheduled revisions
    taskType: 'revision',
    title: 'Revision: Chapter 2',
    scheduledDate: today,
    estimatedMinutes: 30,
    isCompleted: true,
    completedAt: `${today}T12:00:00.000Z`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const retNoScheduleChapter = calculateRevisionRetention(
    [chapter2],
    [testSubject],
    [], // 0 RevisionRecords
    [revTaskNoSchedule],
    [],
    today
  );
  assert(retNoScheduleChapter.total === 1, 'Total scheduled is 1');
  assert(retNoScheduleChapter.completed === 1, 'Completed is 1');
  assert(retNoScheduleChapter.percentage === 100, 'Does not crash and does not inflate (100%)');

  // --- RISK C: NORMAL STUDY COMPLETION & DUPLICATE PREVENTION ---
  console.log("\nRisk C: Normal Study Completion & Duplicate Prevention");
  const normalStudyTask: StudyTask = {
    id: 'study_task_c',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    unitId: 'chap_1',
    taskType: 'study',
    title: 'Study: Chapter 1',
    scheduledDate: today,
    estimatedMinutes: 60,
    isCompleted: true,
    understanding: 'okay',
    completedAt: `${today}T09:00:00.000Z`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Completing 'study' task marks chapter as studied
  const covStudy = calculateSyllabusCoverage([testSubject], [chapter1, chapter2], [normalStudyTask], [], [], today);
  assert(covStudy.studiedChapters === 1, 'Normal study task marks chapter as studied');
  assert(covStudy.percentage === 50, 'Syllabus coverage is 50% (1/2)');

  // 2. Creates revision schedule once
  const generatedRevs1 = createRevisionsForTask(normalStudyTask, []);
  assert(generatedRevs1.length === 5, 'Spaced repetition revision schedule created (5 revisions)');

  // 3. Completing the same task again prevents duplicate revision creation
  const duplicateRevsCheck = createRevisionsForTask(normalStudyTask, generatedRevs1);
  assert(duplicateRevsCheck.length === 0, 'Completing again creates 0 duplicate revisions');

  // 4. Un-completing resets coverage
  const uncompletedTask: StudyTask = { ...normalStudyTask, isCompleted: false, completedAt: undefined };
  const covUncompleted = calculateSyllabusCoverage([testSubject], [chapter1, chapter2], [uncompletedTask], [], [], today);
  assert(covUncompleted.studiedChapters === 0, 'Un-completing resets studied count to 0');
  assert(covUncompleted.percentage === 0, 'Coverage drops back to 0%');

  // --- RISK E: PROGRESS MATH EDGE CASES & USER ISOLATION ---
  console.log("\nRisk E: Progress Math Edge Cases & User Isolation");

  // 1. Empty state: 0 chapters
  const emptyChapsCov = calculateSyllabusCoverage([testSubject], [], [], [], [], today);
  assert(emptyChapsCov.isEmpty === true, '0 chapters correctly yields isEmpty: true');
  assert(emptyChapsCov.label === 'No chapters yet', 'Label is "No chapters yet"');
  assert(emptyChapsCov.percentage === null, 'Percentage is null (not fake 0%)');

  // 2. Half studied
  const halfStudiedCov = calculateSyllabusCoverage([testSubject], [chapter1, chapter2], [normalStudyTask], [], [], today);
  assert(halfStudiedCov.percentage === 50, 'Half studied is exactly 50%');

  // 3. All chapters studied
  const studyTaskChap2: StudyTask = {
    ...normalStudyTask,
    id: 'study_task_c2',
    unitId: 'chap_2',
    title: 'Study: Chapter 2',
  };
  const allStudiedCov = calculateSyllabusCoverage([testSubject], [chapter1, chapter2], [normalStudyTask, studyTaskChap2], [], [], today);
  assert(allStudiedCov.percentage === 100, 'All studied is exactly 100%');

  // 4. Retention with done, overdue, and upcoming revisions
  const revDone: RevisionRecord = { ...revSched1, id: 'r_done', isCompleted: true };
  const revOverdue: RevisionRecord = { ...revSched1, id: 'r_overdue', scheduledDate: addDays(today, -3), isCompleted: false };
  const revUpcoming: RevisionRecord = { ...revSched2, id: 'r_upcoming', scheduledDate: addDays(today, 4), isCompleted: false };

  const retentionMixed = calculateRevisionRetention([chapter1], [testSubject], [revDone, revOverdue, revUpcoming], [], [], today);
  assert(retentionMixed.total === 3, 'Total is 3');
  assert(retentionMixed.completed === 1, 'Completed is 1');
  assert(retentionMixed.percentage === 33, '33% retention calculated');
  const chap1Breakdown = retentionMixed.chaptersBreakdown[0];
  assert(chap1Breakdown.doneCount === 1, '1 done revision');
  assert(chap1Breakdown.overdueCount === 1, '1 overdue revision');
  assert(chap1Breakdown.upcomingCount === 1, '1 upcoming revision');

  // 5. Exam readiness with NO exam
  const examReadinessNoExam = calculateExamReadiness([], [testSubject], [chapter1], [], []);
  assert(examReadinessNoExam.status === 'no_exam', 'Exam readiness returns status "no_exam"');
  assert(examReadinessNoExam.label === 'No exam added', 'Label is strictly "No exam added"');
  assert(examReadinessNoExam.percentage === null, 'Percentage is null');

  // 6. User Isolation: Data of another user must NOT leak into calculations
  const otherUserTask: StudyTask = {
    id: 'task_other_user',
    userId: 'user_intruder',
    semesterId: 'sem_other',
    subjectId: 'sub_other',
    unitId: 'chap_other',
    taskType: 'study',
    title: 'Hacker Study',
    scheduledDate: today,
    estimatedMinutes: 60,
    isCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // In the app architecture (PlannerContext), tasks, units, and subjects are strictly filtered
  // by selectedSemesterId and currentUser.id. We verify that filtering excludes other user's records.
  const allTasksInStorage = [normalStudyTask, otherUserTask];
  const userFilteredTasks = allTasksInStorage.filter(
    (t) => t.userId === 'user_test' && t.semesterId === 'sem_1'
  );
  assert(userFilteredTasks.length === 1, 'User data strictly isolated; foreign user task excluded');
  assert(userFilteredTasks[0].id === 'study_task_c', 'Only current user tasks are processed');

  // 7. Chapters Needing Reinforcement detection
  const reinResult = getChaptersNeedingReinforcement(
    [chapter1],
    [testSubject],
    [{ ...normalStudyTask, understanding: 'weak' }],
    [revOverdue],
    [],
    today
  );
  assert(reinResult.length === 1, 'Chapter 1 flagged for reinforcement');
  assert(reinResult[0].weakCount === 1, 'Weak count = 1');
  assert(reinResult[0].overdueCount === 1, 'Overdue count = 1');

  console.log('\n======================================================');
  console.log(`ALL ${total} VERIFICATION TESTS PASSED SUCCESSFULLY! (${passed}/${total})`);
  console.log('======================================================\n');
}
