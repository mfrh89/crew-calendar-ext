import type { DayBarInfo, CalendarEvent } from '../types';

const STRIP_ID = 'crew-calendar-strip';
const BANNER_ID = 'crew-calendar-banner';
const TOUCH_HEIGHT = 44;
const MAX_DOTS = 3;
const DOT_SIZE = 10;
const DOT_OVERLAP = -3;

export interface HolidayLayer {
  days: Set<number>;
  color: string;
}

export function injectBanner(dayBar: DayBarInfo): void {
  if (document.getElementById(BANNER_ID)) return;

  const canvas = dayBar.canvasElement;

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.style.cssText = `
    padding: 5px 10px;
    background: #05164D;
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #fff;
    line-height: 1.4;
    pointer-events: none;
  `;
  banner.innerHTML = '<strong>Crew Calendar</strong> — colored dots show your private events. Click for details.';

  canvas.parentNode!.insertBefore(banner, canvas);
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
  publicHolidays: HolidayLayer[] = [],
  schoolHolidays: HolidayLayer[] = [],
): HTMLElement {
  removeStrip();

  const canvas = dayBar.canvasElement;

  const strip = document.createElement('div');
  strip.id = STRIP_ID;
  strip.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${dayBar.totalColumns}, 1fr);
    width: ${dayBar.canvasWidth}px;
    padding-left: ${dayBar.leftOffset}px;
    background: linear-gradient(to right, #ddd ${dayBar.leftOffset}px, #f0f0f0 ${dayBar.leftOffset}px);
    border-bottom: 2px solid #cc0000;
    font-family: Arial, sans-serif;
    box-sizing: border-box;
    pointer-events: none;
  `;

  const eventsByDay = groupEventsByDay(events, dayBar.year, dayBar.month);

  for (let col = 0; col < dayBar.totalColumns; col++) {
    const dayNum = col + 1;
    const inMonth = dayNum <= dayBar.daysInMonth;
    const dayEvents = inMonth ? (eventsByDay.get(dayNum) ?? []) : [];
    const isWeekend = inMonth && isWeekendDay(dayBar.year, dayBar.month, dayNum);

    // School holidays: collect all matching layers
    const schoolLayers = inMonth ? schoolHolidays.filter(l => l.days.has(dayNum)) : [];

    // Public holidays: collect all matching layers for border
    const pubLayers = inMonth ? publicHolidays.filter(l => l.days.has(dayNum)) : [];

    // Build box-shadow for stacked public holiday borders (2px per layer, inset)
    const boxShadow = pubLayers
      .map((l, i) => `inset 0 0 0 ${(i + 1) * 2}px ${safeColor(l.color)}`)
      .join(', ');

    let bg: string;
    if (schoolLayers.length >= 2) {
      const c1 = hexToRgba(safeColor(schoolLayers[0].color), 0.45);
      const c2 = hexToRgba(safeColor(schoolLayers[1].color), 0.45);
      bg = `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`;
    } else if (schoolLayers.length === 1) {
      bg = hexToRgba(safeColor(schoolLayers[0].color), 0.35);
    } else {
      bg = isWeekend ? '#e0e0e0' : '#f0f0f0';
    }

    const cell = document.createElement('div');
    cell.style.cssText = `
      height: ${TOUCH_HEIGHT}px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border-right: 1px solid #ddd;
      background: ${bg};
      ${boxShadow ? `box-shadow: ${boxShadow};` : ''}
    `;

    if (dayEvents.length === 1) {
      const dot = createDot(dayEvents[0]);
      dot.style.pointerEvents = 'auto';
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        onSingleClick(dayEvents, dayNum);
      });
      cell.appendChild(dot);
    } else if (dayEvents.length > 1) {
      cell.style.cursor = 'pointer';
      cell.style.pointerEvents = 'auto';
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

  canvas.parentNode!.insertBefore(strip, canvas);

  // Notify the page that layout shifted so it can recalculate element positions
  window.dispatchEvent(new Event('resize'));

  console.log('[CrewCal] Strip injected with', dayBar.totalColumns, 'columns,', dayBar.daysInMonth, 'active days');
  return strip;
}

export function removeStrip(): void {
  const existed = !!document.getElementById(STRIP_ID);
  document.getElementById(STRIP_ID)?.remove();
  if (existed) window.dispatchEvent(new Event('resize'));
}

function safeColor(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#888888';
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createDot(event: CalendarEvent): HTMLDivElement {
  const dot = document.createElement('div');
  dot.style.cssText = `
    width: ${DOT_SIZE}px;
    height: ${DOT_SIZE}px;
    border-radius: 50%;
    background: ${safeColor(event.color)};
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
