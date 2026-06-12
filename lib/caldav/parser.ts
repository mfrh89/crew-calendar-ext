import ICAL from 'ical.js';
import type { CalendarEvent } from '../types';

export function parseCalendarObjects(
  icalData: string,
  calendarUrl: string,
  calendarColor: string,
): CalendarEvent[] {
  const jcalData = ICAL.parse(icalData);
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
        dtend: event.endDate.toJSDate().toISOString(),
        location: event.location || undefined,
        description: event.description || undefined,
        calendarUrl,
        calendarColor,
        isAllDay: event.startDate.isDate,
      });
    } catch {
      // skip malformed events
    }
  }

  return events;
}
