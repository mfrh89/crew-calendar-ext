import { createDAVClient, type DAVCalendar } from 'tsdav';
import type { CalDAVConfig, CalendarInfo } from '../types';
import { parseCalendarObjects } from './parser';
import type { CalendarEvent } from '../types';

export async function connectAndFetchCalendars(
  config: CalDAVConfig,
): Promise<CalendarInfo[]> {
  const client = await createDAVClient({
    serverUrl: config.serverUrl,
    credentials: {
      username: config.username,
      password: config.password,
    },
    authMethod: config.authMethod === 'Basic' ? 'Basic' : 'Oauth',
    defaultAccountType: 'caldav',
  });

  const calendars = await client.fetchCalendars();

  return calendars.map((cal) => ({
    url: cal.url,
    displayName: cal.displayName ?? cal.url.split('/').filter(Boolean).pop() ?? 'Calendar',
    color: extractColor(cal) ?? '#4285f4',
  }));
}

export async function fetchEventsForMonth(
  config: CalDAVConfig,
  calendarUrl: string,
  calendarColor: string,
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
  const client = await createDAVClient({
    serverUrl: config.serverUrl,
    credentials: {
      username: config.username,
      password: config.password,
    },
    authMethod: config.authMethod === 'Basic' ? 'Basic' : 'Oauth',
    defaultAccountType: 'caldav',
  });

  const calendars = await client.fetchCalendars();
  const calendar = calendars.find((c) => c.url === calendarUrl);
  if (!calendar) return [];

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const objects = await client.fetchCalendarObjects({
    calendar,
    timeRange: {
      start: formatDateUTC(start),
      end: formatDateUTC(end),
    },
  });

  const events: CalendarEvent[] = [];
  for (const obj of objects) {
    if (!obj.data) continue;
    const parsed = parseCalendarObjects(obj.data, calendarUrl, calendarColor);
    events.push(...parsed);
  }

  return events;
}

function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}T000000Z`;
}

function extractColor(cal: DAVCalendar): string | null {
  const props = cal.props as Record<string, unknown> | undefined;
  if (!props) return null;

  const color =
    (props['calendar-color'] as string) ??
    (props['{http://apple.com/ns/ical/}calendar-color'] as string);

  if (color && /^#[0-9a-fA-F]{6,8}$/.test(color)) {
    return color.slice(0, 7);
  }
  return null;
}
