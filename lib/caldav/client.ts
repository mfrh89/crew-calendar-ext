import { parseICS } from './parser';
import type { CalendarEvent } from '../types';

export async function fetchICSEvents(
  url: string,
  color: string,
): Promise<CalendarEvent[]> {
  const fetchUrl = url.replace(/^webcal:\/\//, 'https://');
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`);
  }
  const icsData = await response.text();
  return parseICS(icsData, url, color);
}
