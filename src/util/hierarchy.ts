import { Semester, Subject, Unit, Topic, Exam, StudyTask, RevisionRecord, StudyResource } from '../types';

export interface StorageState {
  semesters: Semester[];
  subjects: Subject[];
  units: Unit[];
  topics: Topic[];
  exams: Exam[];
  tasks: StudyTask[];
  revisions: RevisionRecord[];
  resources: StudyResource[];
}

/**
 * Performs clean cascade deletion of a Semester and all its child entities.
 */
export function cascadeDeleteSemester(state: StorageState, semesterId: string): StorageState {
  return {
    ...state,
    semesters: state.semesters.filter((s) => s.id !== semesterId),
    subjects: state.subjects.filter((s) => s.semesterId !== semesterId),
    units: state.units.filter((u) => u.semesterId !== semesterId),
    topics: state.topics.filter((t) => t.semesterId !== semesterId),
    exams: state.exams.filter((e) => e.semesterId !== semesterId),
    tasks: state.tasks.filter((t) => t.semesterId !== semesterId),
    revisions: state.revisions.filter((r) => r.semesterId !== semesterId),
    resources: state.resources.filter((res) => res.semesterId !== semesterId),
  };
}

/**
 * Performs clean cascade deletion of a Subject and its dependent units, topics, tasks, revisions.
 */
export function cascadeDeleteSubject(state: StorageState, subjectId: string): StorageState {
  return {
    ...state,
    subjects: state.subjects.filter((s) => s.id !== subjectId),
    units: state.units.filter((u) => u.subjectId !== subjectId),
    topics: state.topics.filter((t) => t.subjectId !== subjectId),
    exams: state.exams.filter((e) => e.subjectId !== subjectId),
    tasks: state.tasks.filter((t) => t.subjectId !== subjectId),
    revisions: state.revisions.filter((r) => r.subjectId !== subjectId),
    resources: state.resources.filter((res) => res.subjectId !== subjectId),
  };
}

/**
 * Performs clean cascade deletion of a Unit and its dependent topics, tasks, revisions.
 */
export function cascadeDeleteUnit(state: StorageState, unitId: string): StorageState {
  const unitTopicIds = new Set(state.topics.filter((t) => t.unitId === unitId).map((t) => t.id));
  return {
    ...state,
    units: state.units.filter((u) => u.id !== unitId),
    topics: state.topics.filter((t) => t.unitId !== unitId),
    tasks: state.tasks.filter((t) => t.unitId !== unitId && (!t.topicId || !unitTopicIds.has(t.topicId))),
    revisions: state.revisions.filter((r) => r.unitId !== unitId && (!r.topicId || !unitTopicIds.has(r.topicId))),
  };
}

/**
 * Performs clean cascade deletion of a Topic and its tasks and pending revisions.
 */
export function cascadeDeleteTopic(state: StorageState, topicId: string): StorageState {
  return {
    ...state,
    topics: state.topics.filter((t) => t.id !== topicId),
    tasks: state.tasks.filter((t) => t.topicId !== topicId),
    revisions: state.revisions.filter((r) => r.topicId !== topicId),
  };
}
