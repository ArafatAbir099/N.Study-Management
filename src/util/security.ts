export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

export function getUserStorageKey(userId: string, key: string): string {
  const safeUser = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, '') : 'guest';
  return `study_os_${safeUser}_${key}`;
}
