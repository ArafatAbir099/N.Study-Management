/**
 * Date utilities designed for consistent calendar day calculations (YYYY-MM-DD)
 * to completely eliminate UTC midnight shifting and off-by-one errors.
 */

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDateString(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0); // Noon to avoid any DST edge
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Returns (dateA - dateB) in calendar days.
 * E.g., if dateA is tomorrow and dateB is today, returns 1.
 */
export function diffDays(dateA: string, dateB: string): number {
  if (!isValidDateString(dateA) || !isValidDateString(dateB)) return 0;
  const da = parseLocalDate(dateA).getTime();
  const db = parseLocalDate(dateB).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((da - db) / msPerDay);
}

export function isBefore(dateA: string, dateB: string): boolean {
  return dateA < dateB;
}

export function isAfter(dateA: string, dateB: string): boolean {
  return dateA > dateB;
}

export function isSameOrBefore(dateA: string, dateB: string): boolean {
  return dateA <= dateB;
}

export function formatDisplayDate(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr || 'N/A';
  const today = getTodayString();
  const diff = diffDays(dateStr, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';

  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

export function formatCountdown(examDateStr: string): { days: number; text: string; isPast: boolean; isToday: boolean } {
  if (!isValidDateString(examDateStr)) {
    return { days: 0, text: 'No date', isPast: false, isToday: false };
  }
  const today = getTodayString();
  const days = diffDays(examDateStr, today);

  if (days < 0) {
    return { days: Math.abs(days), text: `${Math.abs(days)}d ago`, isPast: true, isToday: false };
  }
  if (days === 0) {
    return { days: 0, text: 'Today!', isPast: false, isToday: true };
  }
  if (days === 1) {
    return { days: 1, text: 'Tomorrow', isPast: false, isToday: false };
  }
  return { days, text: `${days} days left`, isPast: false, isToday: false };
}
