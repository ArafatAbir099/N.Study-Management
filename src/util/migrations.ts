import { getUserStorageKey } from './security';

/**
 * Migrates any legacy un-scoped localStorage keys to per-user keys.
 * This fixes the security leak where selected_sem_id or study_planner_chat_msgs were shared across users.
 */
export function migrateLegacyStorageForUser(userId: string): void {
  try {
    const legacySemKey = 'selected_sem_id';
    const legacyVal = localStorage.getItem(legacySemKey);
    const userSemKey = getUserStorageKey(userId, 'selected_sem_id');

    if (legacyVal && !localStorage.getItem(userSemKey)) {
      localStorage.setItem(userSemKey, legacyVal);
    }
    // Clean up global key so it does not leak into other users
    if (legacyVal) {
      localStorage.removeItem(legacySemKey);
    }

    const legacyChatKey = 'study_planner_chat_msgs';
    const legacyChatVal = localStorage.getItem(legacyChatKey);
    const userChatKey = getUserStorageKey(userId, 'chat_messages');
    if (legacyChatVal && !localStorage.getItem(userChatKey)) {
      localStorage.setItem(userChatKey, legacyChatVal);
    }
    if (legacyChatVal) {
      localStorage.removeItem(legacyChatKey);
    }

    // Migrate master data: ensure chapters (unitId) on tasks and default taskType: 'study'
    const masterDataKey = getUserStorageKey(userId, 'master_data');
    const masterDataRaw = localStorage.getItem(masterDataKey);
    if (masterDataRaw) {
      const data = JSON.parse(masterDataRaw);
      let changed = false;
      const topics = data.topics || [];
      const topicMap = new Map<string, string>(); // topicId -> unitId
      for (const t of topics) {
        if (t.id && t.unitId) {
          topicMap.set(t.id, t.unitId);
        }
      }

      if (Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          if (!task.taskType) {
            task.taskType = 'study';
            changed = true;
          }
          if (!task.unitId && task.topicId && topicMap.has(task.topicId)) {
            task.unitId = topicMap.get(task.topicId);
            changed = true;
          }
        }
      }

      if (Array.isArray(data.revisions)) {
        const taskMap = new Map<string, string>(); // taskId -> unitId
        if (Array.isArray(data.tasks)) {
          for (const t of data.tasks) {
            if (t.id && t.unitId) taskMap.set(t.id, t.unitId);
          }
        }
        for (const rev of data.revisions) {
          if (!rev.unitId) {
            if (rev.topicId && topicMap.has(rev.topicId)) {
              rev.unitId = topicMap.get(rev.topicId);
              changed = true;
            } else if (rev.studyTaskId && taskMap.has(rev.studyTaskId)) {
              rev.unitId = taskMap.get(rev.studyTaskId);
              changed = true;
            }
          }
        }
      }

      if (changed) {
        localStorage.setItem(masterDataKey, JSON.stringify(data));
      }
    }
  } catch (err) {
    console.warn('Storage migration notice:', err);
  }
}
