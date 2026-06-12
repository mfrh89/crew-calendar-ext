import type { DayBarInfo } from './detector';
import type { CalendarEvent } from '../types';

const STRIP_ID = 'crew-calendar-strip';

export function injectStrip(
  dayBar: DayBarInfo,
  events: CalendarEvent[],
  position: 'above' | 'below',
  onEventClick: (event: CalendarEvent) => void,
): HTMLElement {
  removeStrip();

  const strip = document.createElement('tr');
  strip.id = STRIP_ID;
  strip.style.cssText = 'background: #f8f9fa; border-top: 2px solid #cc0000;';

  const eventsByDay = groupEventsByDay(events, dayBar.year, dayBar.month);

  for (let i = 0; i < dayBar.cells.length; i++) {
    const cell = dayBar.cells[i];
    const dayNum = i + 1;
    const dayEvents = eventsByDay.get(dayNum) ?? [];

    const td = document.createElement('td');
    td.style.cssText = `
      padding: 2px;
      vertical-align: top;
      text-align: center;
      font-size: 10px;
      min-height: 24px;
      position: relative;
      border-right: 1px solid #ddd;
    `;

    const isWeekend = cell.style.backgroundColor || cell.classList.toString().includes('weekend');
    if (isWeekend || isWeekendDay(dayBar.year, dayBar.month, dayNum)) {
      td.style.backgroundColor = '#eee';
    }

    if (dayEvents.length > 0) {
      const dotsContainer = document.createElement('div');
      dotsContainer.style.cssText =
        'display: flex; flex-direction: column; align-items: center; gap: 1px;';

      const maxDots = 3;
      const visible = dayEvents.slice(0, maxDots);

      for (const ev of visible) {
        const dot = document.createElement('div');
        dot.style.cssText = `
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${ev.calendarColor};
          cursor: pointer;
          flex-shrink: 0;
        `;
        dot.title = formatTooltip(ev);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          onEventClick(ev);
        });
        dotsContainer.appendChild(dot);
      }

      if (dayEvents.length > maxDots) {
        const overflow = document.createElement('div');
        overflow.style.cssText =
          'font-size: 8px; color: #666; cursor: pointer;';
        overflow.textContent = `+${dayEvents.length - maxDots}`;
        overflow.addEventListener('click', (e) => {
          e.stopPropagation();
          onEventClick(dayEvents[0]);
        });
        dotsContainer.appendChild(overflow);
      }

      td.appendChild(dotsContainer);
    }

    strip.appendChild(td);
  }

  if (position === 'above') {
    dayBar.container.parentNode?.insertBefore(strip, dayBar.container);
  } else {
    dayBar.container.parentNode?.insertBefore(
      strip,
      dayBar.container.nextSibling,
    );
  }

  return strip;
}

export function removeStrip(): void {
  document.getElementById(STRIP_ID)?.remove();
}

function groupEventsByDay(
  events: CalendarEvent[],
  year: number,
  month: number,
): Map<number, CalendarEvent[]> {
  const map = new Map<number, CalendarEvent[]>();

  for (const event of events) {
    const start = new Date(event.dtstart);
    const end = new Date(event.dtend);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const effectiveStart = start < monthStart ? monthStart : start;
    const effectiveEnd = end > monthEnd ? monthEnd : end;

    const startDay = effectiveStart.getDate();
    const endDay = event.isAllDay
      ? new Date(effectiveEnd.getTime() - 1).getDate()
      : effectiveEnd.getDate();

    for (let d = startDay; d <= endDay; d++) {
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(event);
    }
  }

  return map;
}

function isWeekendDay(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 0 || dow === 6;
}

function formatTooltip(event: CalendarEvent): string {
  if (event.isAllDay) return event.summary;
  const start = new Date(event.dtstart);
  const time = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  return `${time} ${event.summary}`;
}
