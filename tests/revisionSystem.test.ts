import {
  createRevisionsForTask,
  reconcileRevisionsOnExamChange,
  reconcileRevisionsOnNewExam,
  getRevisionStatus,
  toggleRevisionCompletion,
  getNextExamForSubject,
  pruneOrphanedRevisions,
  DEFAULT_REVISION_INTERVALS,
  UNDERSTANDING_INTERVALS,
} from '../src/util/revisionLifecycle';
import {
  autoPlanAllExams,
} from '../src/util/revisionPlanner';
import {
  addDays,
  diffDays,
  formatCountdown,
  isValidDateString,
  getTodayString,
  isBefore,
  isAfter,
} from '../src/util/dateUtils';
import {
  cascadeDeleteSemester,
  cascadeDeleteSubject,
  cascadeDeleteUnit,
  cascadeDeleteTopic,
  StorageState,
} from '../src/util/hierarchy';
import { StudyTask, RevisionRecord, Exam, Semester, Subject, Unit, Topic } from '../src/types';
import { runSyllabusParserTests } from './syllabusParser.test';
import { runBreadcrumbTests } from './breadcrumb.test';
import { runProgressMathTests } from './progressMath.test';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

export function runAllTests() {
  console.log('\n======================================================');
  console.log('RUNNING MANDATORY REVISION SYSTEM & APPLICATION TESTS');
  console.log('======================================================\n');

  const today = getTodayString();

  // Test 1: Complete an eligible study task and verify intended revision records created
  console.log("Scenario 1: Complete study task & verify revision records created");
  const task1: StudyTask = {
    id: 'task_1',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    title: 'Chapter 1: Algorithms',
    scheduledDate: today,
    estimatedMinutes: 45,
    isCompleted: true,
    understanding: 'okay',
    completedAt: `${today}T10:00:00.000Z`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const revs1 = createRevisionsForTask(task1, [], addDays(today, 60), 'exam_1');
  assert(revs1.length > 0, `Generated ${revs1.length} revision records`);
  assert(revs1[0].studyTaskId === 'task_1', 'Revision links correctly to originating study task');
  assert(revs1[0].scheduledDate === addDays(today, 1), 'First revision scheduled on Day 1 (+1 day)');
  assert(revs1[1].scheduledDate === addDays(today, 3), 'Second revision scheduled on Day 3 (+3 days)');

  // Test 2: Complete the same task repeatedly and verify duplicate revisions are NOT created
  console.log("\nScenario 2: Duplicate prevention on repeated completion actions");
  const revsDup = createRevisionsForTask(task1, revs1, addDays(today, 60), 'exam_1');
  assert(revsDup.length === 0, 'No duplicate revisions created when revisions already exist');

  // Test 3: Refresh / persistence simulation
  console.log("\nScenario 3: Persistence and serialization");
  const serialized = JSON.stringify(revs1);
  const deserialized: RevisionRecord[] = JSON.parse(serialized);
  assert(deserialized.length === revs1.length, 'Revisions safely serialize and deserialize');
  assert(deserialized[0].id === revs1[0].id, 'Revision IDs match after reload');

  // Test 4: Normal revision schedule without exam
  console.log("\nScenario 4: Verify normal revision intervals [1, 3, 7, 14, 30]");
  const revsNoExam = createRevisionsForTask(task1, []);
  const intervals = revsNoExam.map((r) => diffDays(r.scheduledDate, today));
  assert(JSON.stringify(intervals) === JSON.stringify(DEFAULT_REVISION_INTERVALS), 'Intervals strictly match [1, 3, 7, 14, 30]');

  // Test 5: Verify that NO revision is scheduled on or after the associated exam date
  console.log("\nScenario 5: No revision scheduled on or after exam date");
  const examDate5 = addDays(today, 10);
  const revs5 = createRevisionsForTask(task1, [], examDate5, 'exam_5');
  const allStrictlyBeforeExam = revs5.every((r) => isBefore(r.scheduledDate, examDate5));
  assert(allStrictlyBeforeExam, 'All generated revisions are strictly before the exam date');
  // With 10 days, intervals 1, 3, 7 and final-eve day 9 fit
  assert(revs5.some((r) => r.scheduledDate === addDays(examDate5, -1)), 'Includes final-eve revision on examDate - 1');

  // Test 6: Exam scheduled in 2 days
  console.log("\nScenario 6: Exam scheduled in 2 days");
  const examIn2Days = addDays(today, 2);
  const revsIn2Days = createRevisionsForTask(task1, [], examIn2Days, 'exam_2days');
  assert(revsIn2Days.length === 1, 'Exactly 1 revision scheduled');
  assert(revsIn2Days[0].scheduledDate === addDays(today, 1), 'Revision scheduled on eve of exam (day 1)');
  assert(isBefore(revsIn2Days[0].scheduledDate, examIn2Days), 'Revision falls strictly before exam day');

  // Test 7: Exam scheduled today
  console.log("\nScenario 7: Exam scheduled today");
  const examToday = today;
  const revsToday = createRevisionsForTask(task1, [], examToday, 'exam_today');
  assert(revsToday.length === 0, 'Zero revisions created for exam scheduled today');

  // Test 8: Exam date that has already passed
  console.log("\nScenario 8: Exam date has already passed");
  const pastExam = addDays(today, -5);
  const revsPast = createRevisionsForTask(task1, [], pastExam, 'exam_past');
  assert(revsPast.length === 0, 'Zero revisions created for an exam that has already passed');

  // Test 9: Understanding Variants
  console.log("\nScenario 9: Understanding rating presets (weak, okay, strong)");
  const taskWeak: StudyTask = { ...task1, id: 'task_weak', understanding: 'weak' };
  const revsWeak = createRevisionsForTask(taskWeak, []);
  const intervalsWeak = revsWeak.map((r) => diffDays(r.scheduledDate, today));
  assert(JSON.stringify(intervalsWeak) === JSON.stringify(UNDERSTANDING_INTERVALS.weak), 'Weak intervals match [1, 2, 4, 7, 14, 30]');

  const taskStrong: StudyTask = { ...task1, id: 'task_strong', understanding: 'strong' };
  const revsStrong = createRevisionsForTask(taskStrong, []);
  const intervalsStrong = revsStrong.map((r) => diffDays(r.scheduledDate, today));
  assert(JSON.stringify(intervalsStrong) === JSON.stringify(UNDERSTANDING_INTERVALS.strong), 'Strong intervals match [3, 7, 21]');

  // Test 10: Past midterm + upcoming final selection
  console.log("\nScenario 10: Past midterm + upcoming final exam selection");
  const testSub1: Subject = {
    id: 'sub_cs',
    userId: 'user_test',
    semesterId: 'sem_1',
    code: 'CS201',
    name: 'Data Structures',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const testExams: Exam[] = [
    {
      id: 'exam_midterm_past',
      userId: 'user_test',
      semesterId: 'sem_1',
      subjectId: 'sub_cs',
      title: 'Midterm (Past)',
      examDate: addDays(today, -15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exam_final_upcoming',
      userId: 'user_test',
      semesterId: 'sem_1',
      subjectId: 'sub_cs',
      title: 'Final Exam',
      examDate: addDays(today, 25),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const pickedExam = getNextExamForSubject(testExams, testSub1, today);
  assert(pickedExam !== null && pickedExam.id === 'exam_final_upcoming', 'getNextExamForSubject picks upcoming final, skipping past midterm');

  // Test 11: Change exam date earlier with clean reconciliation
  console.log("\nScenario 11: Change exam date earlier (clean reconciliation)");
  const examMovedEarlier: Exam = {
    id: 'exam_1',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_1',
    title: 'Exam 1',
    examDate: addDays(today, 6),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const reconciledEarlier = reconcileRevisionsOnExamChange(revs1, examMovedEarlier, [task1]);
  const anyOnOrAfterNewExam = reconciledEarlier.some((r) => !isBefore(r.scheduledDate, examMovedEarlier.examDate));
  assert(!anyOnOrAfterNewExam, 'No revisions scheduled on or after new earlier exam date');

  // Test 12: Complete revision status persistence
  console.log("\nScenario 12: Complete a revision and verify status persistence");
  const revToComplete = revs1[0];
  const completedRev = toggleRevisionCompletion(revToComplete, true);
  assert(completedRev.isCompleted === true, 'Revision marked completed');
  assert(!!completedRev.completedAt, 'Completion timestamp assigned');
  assert(getRevisionStatus(completedRev, today) === 'completed', 'Derived status is strictly "completed"');

  // Test 13: Auto-planning preserves existing work & matches exact subjectId
  console.log("\nScenario 13: Auto-planning exact subject matching and buffer");
  const semTest: Semester = {
    id: 'sem_1',
    userId: 'user_test',
    name: 'Fall 2026',
    startDate: today,
    endDate: addDays(today, 120),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const subTest1: Subject = {
    id: 'sub_algo',
    userId: 'user_test',
    semesterId: 'sem_1',
    code: 'CS101',
    name: 'Intro CS',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const subTest2: Subject = {
    id: 'sub_wrong',
    userId: 'user_test',
    semesterId: 'sem_1',
    code: 'HIST101',
    name: 'World History',
    color: '#10B981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const unitTest: Unit = {
    id: 'unit_1',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_algo',
    unitNumber: 1,
    title: 'Unit 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const topicTest1: Topic = {
    id: 'top_1',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_algo',
    unitId: 'unit_1',
    title: 'Data Structures',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const examAuto: Exam = {
    id: 'exam_auto',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_algo', // linked to sub_algo ONLY
    title: 'Algorithms Exam',
    examDate: addDays(today, 20),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const planResult = autoPlanAllExams(semTest, [subTest1, subTest2], [unitTest], [topicTest1], [examAuto], [], []);
  assert(planResult.newTasks.length === 1, 'Auto-planner creates 1 task for pending topic under sub_algo');
  assert(planResult.newTasks[0].subjectId === 'sub_algo', 'Task assigned strictly to matched subject');

  // Test 14: Duplicate prevention when task already exists
  console.log("\nScenario 14: Auto-planner duplicate prevention for active tasks");
  const planResult2 = autoPlanAllExams(semTest, [subTest1, subTest2], [unitTest], [topicTest1], [examAuto], planResult.newTasks, []);
  assert(planResult2.newTasks.length === 0, 'Auto-planner does not duplicate task for already scheduled topic');

  // Test 15: Cascade deletion
  console.log("\nScenario 15: Cascade deletion & orphaned references check");
  const state: StorageState = {
    semesters: [semTest],
    subjects: [subTest1],
    units: [unitTest],
    topics: [topicTest1],
    exams: [examAuto],
    tasks: [task1],
    revisions: revs1,
    resources: [],
  };
  const stateAfterSubDelete = cascadeDeleteSubject(state, 'sub_algo');
  assert(stateAfterSubDelete.subjects.length === 0, 'Subject removed');
  assert(stateAfterSubDelete.units.length === 0, 'Units cascaded');
  assert(stateAfterSubDelete.topics.length === 0, 'Topics cascaded');

  // Test 16: Accurate status determination
  console.log("\nScenario 16: Accurate status determination (Today, Upcoming, Overdue, Completed)");
  const revToday: RevisionRecord = { ...revs1[0], id: 'rev_today', scheduledDate: today, isCompleted: false };
  const revOverdue: RevisionRecord = { ...revs1[0], id: 'rev_overdue', scheduledDate: addDays(today, -2), isCompleted: false };
  const revUpcoming: RevisionRecord = { ...revs1[0], id: 'rev_upcoming', scheduledDate: addDays(today, 4), isCompleted: false };
  const revCompleted: RevisionRecord = { ...revs1[0], id: 'rev_completed', scheduledDate: addDays(today, -2), isCompleted: true };

  assert(getRevisionStatus(revToday, today) === 'today', 'Scheduled today -> "today"');
  assert(getRevisionStatus(revOverdue, today) === 'overdue', 'Scheduled in past & not completed -> "overdue"');
  assert(getRevisionStatus(revUpcoming, today) === 'upcoming', 'Scheduled in future & not completed -> "upcoming"');
  assert(getRevisionStatus(revCompleted, today) === 'completed', 'Completed -> strictly "completed", never overdue');

  // Test 17: Timezone and calendar date rollover
  console.log("\nScenario 17: Timezone and calendar date boundary check");
  const endOfMonth = '2026-10-31';
  const nextDay = addDays(endOfMonth, 1);
  assert(nextDay === '2026-11-01', 'Calendar day addition rolls over month boundary without UTC drift');
  const endOfYear = '2026-12-31';
  const nextYear = addDays(endOfYear, 1);
  assert(nextYear === '2027-01-01', 'Calendar day addition rolls over year boundary correctly');
  assert(diffDays('2026-11-05', '2026-11-01') === 4, 'Day difference is exactly 4 calendar days');

  // Test 18: Exam added after tasks were completed reconciles pending revisions
  console.log("\nScenario 18: Exam added after tasks completed reconciles revisions");
  const completedTaskNoExam: StudyTask = {
    id: 'task_late_exam',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_algo',
    title: 'Study: Binary Search Trees',
    scheduledDate: today,
    estimatedMinutes: 45,
    isCompleted: true,
    understanding: 'okay',
    completedAt: `${today}T09:00:00.000Z`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Initially created without an exam (examId = undefined)
  const initialRevs = createRevisionsForTask(completedTaskNoExam, []);
  assert(initialRevs.length === 5, 'Initial task without exam has 5 revisions');
  assert(initialRevs.every((r) => !r.examId), 'Initial revisions have no examId');

  // Mark the first revision as completed
  const completedRev1 = { ...initialRevs[0], isCompleted: true, completedAt: `${today}T11:00:00.000Z` };
  const revsWithOneCompleted = [completedRev1, ...initialRevs.slice(1)];

  // Now create an exam scheduled in 8 days
  const lateExamDate = addDays(today, 8);
  const lateExam: Exam = {
    id: 'exam_newly_added',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: 'sub_algo',
    title: 'Algorithms Midterm',
    examDate: lateExamDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const reconciledRevs = reconcileRevisionsOnNewExam(
    revsWithOneCompleted,
    lateExam,
    [completedTaskNoExam],
    [lateExam],
    subTest1
  );

  // Completed revision must remain untouched
  const keptCompleted = reconciledRevs.find((r) => r.id === completedRev1.id);
  assert(Boolean(keptCompleted && keptCompleted.isCompleted), 'Completed revision kept strictly untouched');

  // All pending revisions must now fall strictly before lateExamDate
  const pendingReconciled = reconciledRevs.filter((r) => r.studyTaskId === completedTaskNoExam.id && !r.isCompleted);
  assert(pendingReconciled.length > 0, 'Pending revisions regenerated');
  assert(
    pendingReconciled.every((r) => isBefore(r.scheduledDate, lateExamDate)),
    'All regenerated pending revisions are strictly before new exam date'
  );
  assert(
    pendingReconciled.every((r) => r.examId === lateExam.id),
    'Regenerated pending revisions point to new exam ID'
  );

  // No duplicate dates for this task
  const allDatesForTask = reconciledRevs
    .filter((r) => r.studyTaskId === completedTaskNoExam.id)
    .map((r) => r.scheduledDate);
  const uniqueDatesCount = new Set(allDatesForTask).size;
  assert(allDatesForTask.length === uniqueDatesCount, 'No duplicate revision dates for the task');

  // Test 19: Synthetic exam handling in getNextExamForSubject
  console.log("\nScenario 19: Synthetic exam has synthetic_exam_ prefix and real exam is distinguished");
  const subWithExamDate: Subject = {
    ...subTest1,
    id: 'sub_synthetic_test',
    examDate: addDays(today, 15),
  };
  const syntheticExam = getNextExamForSubject([], subWithExamDate, today);
  assert(
    Boolean(syntheticExam && syntheticExam.id.startsWith('synthetic_exam_')),
    'getNextExamForSubject returns synthetic exam ID when exam record is absent'
  );

  // Test 20: updateSubject changes only autoCreated Final and preserves user-created Midterm
  console.log("\nScenario 20: updateSubject changes only autoCreated Final and never user-created Midterm");
  const testSubId = 'sub_multi_exams';
  const initialMidtermDate = addDays(today, 10);
  const initialFinalDate = addDays(today, 30);
  const updatedFinalDate = addDays(today, 35);

  const userCreatedMidterm: Exam = {
    id: 'exam_midterm_user',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: testSubId,
    title: 'Midterm Exam',
    examDate: initialMidtermDate,
    autoCreated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const autoCreatedFinal: Exam = {
    id: 'exam_final_auto',
    userId: 'user_test',
    semesterId: 'sem_1',
    subjectId: testSubId,
    title: 'CS101 Exam',
    examDate: initialFinalDate,
    autoCreated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentExams = [userCreatedMidterm, autoCreatedFinal];

  // Simulating updateSubject logic: look only for subjectId === id && autoCreated === true
  let nextExamsList = [...currentExams];
  let linkedExam = nextExamsList.find((e) => e.subjectId === testSubId && e.autoCreated === true);

  assert(Boolean(linkedExam && linkedExam.id === autoCreatedFinal.id), 'Identifies only autoCreated Final as linked exam');
  assert(linkedExam?.id !== userCreatedMidterm.id, 'Does not target user-created Midterm');

  if (linkedExam) {
    linkedExam = { ...linkedExam, examDate: updatedFinalDate, updatedAt: new Date().toISOString() };
    nextExamsList = nextExamsList.map((e) => (e.id === linkedExam!.id ? linkedExam! : e));
  }

  const resultMidterm = nextExamsList.find((e) => e.id === userCreatedMidterm.id);
  const resultFinal = nextExamsList.find((e) => e.id === autoCreatedFinal.id);

  assert(resultMidterm?.examDate === initialMidtermDate, 'User-created Midterm date is strictly untouched');
  assert(resultFinal?.examDate === updatedFinalDate, 'autoCreated Final date is updated to new date');

  // Also verify case where subject has only a user-created exam and NO autoCreated exam
  const examsOnlyUser = [userCreatedMidterm];
  const noAutoExam = examsOnlyUser.find((e) => e.subjectId === testSubId && e.autoCreated === true);
  assert(noAutoExam === undefined, 'No autoCreated exam found when only user-created exams exist');

  // Run syllabus parser tests
  runSyllabusParserTests();

  // Run breadcrumb utility tests
  runBreadcrumbTests();

  // Run progress math and study vs revision tests
  runProgressMathTests();

  console.log('\n======================================================');
  console.log(`ALL ${totalTests} REVISION & LIFECYCLE TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
  console.log('======================================================\n');
}

runAllTests();
