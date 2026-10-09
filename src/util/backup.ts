import { StorageState } from './hierarchy';

export interface BackupData {
  version: number;
  exportedAt: string;
  data: StorageState;
}

export function exportBackup(state: StorageState): string {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(backup, null, 2);
}

export function validateAndParseBackup(jsonString: string): { valid: boolean; data?: StorageState; error?: string } {
  try {
    const parsed = JSON.parse(jsonString) as Partial<BackupData>;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid JSON format.' };
    }
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { valid: false, error: 'Backup does not contain valid data payload.' };
    }

    const { semesters, subjects, units, topics, exams, tasks, revisions } = parsed.data as Partial<StorageState>;
    if (!Array.isArray(semesters) || !Array.isArray(subjects) || !Array.isArray(tasks) || !Array.isArray(revisions)) {
      return { valid: false, error: 'Missing core data arrays in backup file.' };
    }

    const state: StorageState = {
      semesters: Array.isArray(semesters) ? semesters : [],
      subjects: Array.isArray(subjects) ? subjects : [],
      units: Array.isArray(units) ? units : [],
      topics: Array.isArray(topics) ? topics : [],
      exams: Array.isArray(exams) ? exams : [],
      tasks: Array.isArray(tasks) ? tasks : [],
      revisions: Array.isArray(revisions) ? revisions : [],
      resources: Array.isArray(parsed.data.resources) ? parsed.data.resources : [],
    };

    return { valid: true, data: state };
  } catch (err: any) {
    return { valid: false, error: `Failed to parse backup JSON: ${err.message || 'Syntax error'}` };
  }
}
