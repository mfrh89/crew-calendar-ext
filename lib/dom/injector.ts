import type { DayBarInfo, CalendarEvent } from '../types';

const STRIP_ID = 'crew-calendar-strip';

export function injectStrip(
  dayBar: DayBarInfo,
  events: CalendarEvent[],
  position: 'above' | 'below',
  onEventClick: (event: CalendarEvent) => void,
): HTMLElement {
  removeStrip();

  const strip = document.createElement('div');
  strip.id = STRIP_ID;
  strip.style.cssText = `
    display: flex;
    width: ${dayBar.canvasWidth}px;
    background: #f0f0f0;
    border-top: 2px solid #cc0000;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
  `;

  const eventsByDay = groupEventsByDay(events, dayBar.year, dayBar.month);

  for (let dayNum = 1; dayNum <= dayBar.daysInMonth; dayNum++) {
    const dayEvents = eventsByDay.get(dayNum) ?? [];
    const isWeekend = isWeekendDay(dayBar.year, dayBar.month, dayNum);

    const cell = document.createElement('div');
    cell.style.cssText = `
      width: ${dayBar.columnWidth}px;
      min-height: 22px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1px;
      padding: 2px 0;
      box-sizing: border-box;
      border-right: 1px solid #ddd;
      background: ${isWeekend ? '#e0e0e0' : '#f0f0f0'};
      flex-shrink: 0;
    `;

    if (dayEvents.length > 0) {
      const maxDots = 3;
      const visible = dayEvents.slice(0, maxDots);

      for (const ev of visible) {
        const dot = document.createElement('div');
        dot.style.cssText = `
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${ev.color};
          cursor: pointer;
          flex-shrink: 0;
        `;
        dot.title = formatTooltip(ev);
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          onEventClick(ev);
        });
        cell.appendChild(dot);
      }

      if (dayEvents.length > maxDots) {
        const overflow = document.createElement('div');
        overflow.style.cssText = 'font-size: 8px; color: #666; cursor: pointer;';
        overflow.textContent = `+${dayEvents.length - maxDots}`;
        overflow.addEventListener('click', (e) => {
          e.stopPropagation();
          onEventClick(dayEvents[0]);
        });
        cell.appendChild(overflow);
      }
    }

    strip.appendChild(cell);
  }

  // Insert relative to the canvas container
  const anchor = dayBar.anchorElement;
  const parentRow = anchor.closest('tr');
  const insertTarget = parentRow ?? anchor;

  if (position === 'above') {
    insertTarget.parentNode?.insertBefore(strip, insertTarget);
  } else {
    insertTarget.parentNode?.insertBefore(strip, insertTarget.nextSibling);
  }

  console.log('[CrewCal] Strip injected with', dayBar.daysInMonth, 'cells');
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
