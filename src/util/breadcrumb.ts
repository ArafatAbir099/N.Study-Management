import { Unit, Topic } from '../types';

/**
 * Returns a breadcrumb string "Unit › Topic", "Unit", or "Topic"
 * whenever unitId and/or topicId exist and can be resolved.
 */
export function formatBreadcrumb(
  unitId: string | undefined,
  topicId: string | undefined,
  units: Unit[],
  topics: Topic[]
): string | null {
  if (!unitId && !topicId) {
    return null;
  }

  const unit = unitId ? units.find((u) => u.id === unitId) : undefined;
  const topic = topicId ? topics.find((t) => t.id === topicId) : undefined;

  // If unit wasn't provided directly, resolve from topic.unitId
  const resolvedUnit = unit || (topic?.unitId ? units.find((u) => u.id === topic.unitId) : undefined);

  if (resolvedUnit && topic) {
    return `${resolvedUnit.title} › ${topic.title}`;
  }
  if (resolvedUnit) {
    return resolvedUnit.title;
  }
  if (topic) {
    return topic.title;
  }
  return null;
}
