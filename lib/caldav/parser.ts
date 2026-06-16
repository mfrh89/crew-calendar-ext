import ICAL from 'ical.js';
import type { CalendarEvent } from '../types';

export function parseICS(
  icsData: string,
  sourceUrl: string,
  color: string,
  sourceName: string,
): CalendarEvent[] {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');
  const events: CalendarEvent[] = [];

  for (const vevent of vevents) {
    try {
      const event = new ICAL.Event(vevent);

      events.push({
        uid: event.uid,
        summary: event.summary || '(no title)',
        dtstart: event.startDate.toJSDate().toISOString(),
        dtend: (event.endDate ?? event.startDate).toJSDate().toISOString(),
        location: event.location || undefined,
        description: event.description || undefined,
        sourceUrl,
        sourceName,
        color,
        isAllDay: event.startDate.isDate,
      });
    } catch {
      // skip malformed events
    }
  }

  return events;
}
