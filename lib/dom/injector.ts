import type { DayBarInfo, CalendarEvent } from '../types';

const STRIP_ID = 'crew-calendar-strip';
const BANNER_ID = 'crew-calendar-banner';
const TOUCH_HEIGHT = 44;
const MAX_DOTS = 3;
const DOT_SIZE = 10;
const DOT_OVERLAP = -3;

export function injectBanner(container: HTMLElement): void {
  document.getElementById(BANNER_ID)?.remove();

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.style.cssText = `
    padding: 5px 10px;
    background: #f8f8f4;
    border-left: 3px solid #d4a017;
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #555;
    line-height: 1.4;
  `;
  banner.innerHTML = '<strong style="color:#333;">Crew Calendar</strong> Personal calendar overlay — colored dots show your private events. Click for details.';

  const canvas = container.querySelector('canvas');
  if (canvas) {
    container.insertBefore(banner, canvas);
  } else {
    container.prepend(banner);
  }
}

export function removeBanner(): void {
  document.getElementById(BANNER_ID)?.remove();
}

export function injectStrip(
  dayBar: DayBarInfo,
  events: CalendarEvent[],
  _position: 'above' | 'below',
  onSingleClick: (events: CalendarEvent[], day: number) => void,
  onDayClick: (events: CalendarEvent[], day: number) => void,
): HTMLElement {
  removeStrip();

  const container = dayBar.anchorElement;
  const canvas = container.querySelector('canvas');

  const strip = document.createElement('div');
  strip.id = STRIP_ID;
  strip.style.cssText = `
    display: flex;
    width: ${dayBar.canvasWidth}px;
    background: #f0f0f0;
    border-bottom: 2px solid #cc0000;
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
      height: ${TOUCH_HEIGHT}px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border-right: 1px solid #ddd;
      background: ${isWeekend ? '#e0e0e0' : '#f0f0f0'};
      flex-shrink: 0;
    `;

    if (dayEvents.length === 1) {
      const dot = createDot(dayEvents[0]);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        onSingleClick(dayEvents, dayNum);
      });
      cell.appendChild(dot);
    } else if (dayEvents.length > 1) {
      cell.style.cursor = 'pointer';
      const visible = dayEvents.slice(0, MAX_DOTS);
      const hasOverflow = dayEvents.length > MAX_DOTS;

      const dotGroup = document.createElement('div');
      dotGroup.style.cssText = `
        display: flex;
        align-items: center;
        pointer-events: none;
      `;

      for (let i = 0; i < visible.length; i++) {
        const dot = createDot(visible[i]);
        if (i > 0) dot.style.marginLeft = `${DOT_OVERLAP}px`;
        dot.style.zIndex = String(visible.length - i);
        dot.style.boxShadow = '0 0 0 1px #f0f0f0';
        dotGroup.appendChild(dot);
      }

      if (hasOverflow) {
        const badge = document.createElement('div');
        badge.style.cssText = `
          font-size: 8px;
          color: #555;
          font-weight: bold;
          margin-left: 1px;
          line-height: 1;
          white-space: nowrap;
        `;
        badge.textContent = `+${dayEvents.length - MAX_DOTS}`;
        dotGroup.appendChild(badge);
      }

      cell.appendChild(dotGroup);
      cell.title = dayEvents.map(e => formatTooltip(e)).join('\n');
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        onDayClick(dayEvents, dayNum);
      });
    }

    strip.appendChild(cell);
  }

  if (canvas) {
    container.insertBefore(strip, canvas);
  } else {
    container.appendChild(strip);
  }

  console.log('[CrewCal] Strip injected with', dayBar.daysInMonth, 'cells');
  return strip;
}

export function removeStrip(): void {
  document.getElementById(STRIP_ID)?.remove();
}

function createDot(event: CalendarEvent): HTMLDivElement {
  const dot = document.createElement('div');
  dot.style.cssText = `
    width: ${DOT_SIZE}px;
    height: ${DOT_SIZE}px;
    border-radius: 50%;
    background: ${event.color};
    cursor: pointer;
    flex-shrink: 0;
    position: relative;
  `;
  dot.title = formatTooltip(event);
  return dot;
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

    if (start > monthEnd || end < monthStart) continue;

    const effectiveStart = start < monthStart ? monthStart : start;
    const effectiveEnd = end > monthEnd ? monthEnd : end;

    const startDay = effectiveStart.getDate();
    const endDay = event.isAllDay
      ? new Date(effectiveEnd.getTime() - 86400000).getDate() || effectiveEnd.getDate()
      : effectiveEnd.getDate();

    for (let d = startDay; d <= endDay && d <= new Date(year, month, 0).getDate(); d++) {
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
