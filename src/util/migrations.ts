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
  } catch (err) {
    console.warn('Storage migration notice:', err);
  }
}
