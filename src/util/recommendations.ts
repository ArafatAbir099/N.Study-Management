import { Subject, Unit, Topic, Exam, StudyTask } from '../types';
import { getTodayString, diffDays, isValidDateString } from './dateUtils';

export interface StudyRecommendation {
  subject: Subject;
  topic?: Topic;
  unit?: Unit;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
}

export function getSmartRecommendations(
  subjects: Subject[],
  units: Unit[],
  topics: Topic[],
  exams: Exam[],
  tasks: StudyTask[]
): StudyRecommendation[] {
  const today = getTodayString();
  const recs: StudyRecommendation[] = [];

  // Sort exams by closest date
  const upcomingExams = exams
    .filter((e) => isValidDateString(e.examDate) && diffDays(e.examDate, today) >= 0)
    .sort((a, b) => diffDays(a.examDate, today) - diffDays(b.examDate, today));

  for (const exam of upcomingExams) {
    const daysLeft = diffDays(exam.examDate, today);
    const subject = subjects.find((s) => s.id === exam.subjectId);
    if (!subject) continue;

    const subUnits = units.filter((u) => u.subjectId === subject.id);
    const subTopics = topics.filter((t) => subUnits.some((u) => u.id === t.unitId));
    const incompleteTopics = subTopics.filter((t) => !t.isCompleted);

    if (incompleteTopics.length > 0) {
      const targetTopic = incompleteTopics[0];
      const targetUnit = subUnits.find((u) => u.id === targetTopic.unitId);

      recs.push({
        subject,
        topic: targetTopic,
        unit: targetUnit,
        reason: `Exam "${exam.title}" is in ${daysLeft} days. ${incompleteTopics.length} topics remaining.`,
        urgency: daysLeft <= 7 ? 'high' : daysLeft <= 21 ? 'medium' : 'low',
      });
    }
  }

  return recs;
}
