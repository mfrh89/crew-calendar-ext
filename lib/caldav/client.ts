import { parseICS } from './parser';
import type { CalendarEvent } from '../types';

export async function fetchICSEvents(
  url: string,
  color: string,
  name: string,
): Promise<CalendarEvent[]> {
  const fetchUrl = url.replace(/^webcal:\/\//, 'https://');

  let response: Response;
  try {
    response = await fetch(fetchUrl);
  } catch (e) {
    throw new Error(`Could not reach "${name}" — check URL or network connection.`);
  }

  if (!response.ok) {
    throw new Error(`"${name}" returned HTTP ${response.status}. Check the URL.`);
  }

  const icsData = await response.text();
  const trimmed = icsData.trimStart();

  if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
    throw new Error(`"${name}" returned a web page instead of calendar data. The URL may require login or is not a public ICS link.`);
  }

  if (!trimmed.startsWith('BEGIN:VCALENDAR')) {
    throw new Error(`"${name}" did not return valid calendar data (ICS format expected).`);
  }

  return parseICS(icsData, url, color, name);
}
