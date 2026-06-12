import type { CalendarEvent } from '../types';

function monthKey(year: number, month: number): string {
  return `events_${year}-${String(month).padStart(2, '0')}`;
}

export async function saveEvents(
  year: number,
  month: number,
  events: CalendarEvent[],
): Promise<void> {
  const key = monthKey(year, month);
  await browser.storage.local.set({ [key]: events });
}

export async function loadEvents(
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
  const key = monthKey(year, month);
  const result = await browser.storage.local.get(key);
  return (result[key] as CalendarEvent[]) ?? [];
}

export async function clearOldEvents(
  currentYear: number,
  currentMonth: number,
): Promise<void> {
  const all = await browser.storage.local.get(null);
  const keysToRemove: string[] = [];

  for (const key of Object.keys(all)) {
    if (!key.startsWith('events_')) continue;
    const [, dateStr] = key.split('_');
    const [y, m] = dateStr.split('-').map(Number);
    const monthsDiff = (currentYear - y) * 12 + (currentMonth - m);
    if (monthsDiff > 2) {
      keysToRemove.push(key);
    }
  }

  if (keysToRemove.length > 0) {
    await browser.storage.local.remove(keysToRemove);
  }
}
