import type { DayBarInfo } from '../types';

const CANVAS_ID = 'calendarAndRosterLine';
const CONTAINER_ID = 'calendarAndRosterLineContainer';

export function detectDayBar(): DayBarInfo | null {
  const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
  if (!canvas) {
    console.log('[CrewCal] Canvas #calendarAndRosterLine not found');
    return null;
  }

  const container = document.getElementById(CONTAINER_ID) ?? canvas.parentElement;
  if (!container) return null;

  const { month, year } = readMonthYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalColumns = calculateTotalColumns(year, month, daysInMonth);
  const canvasWidth = canvas.offsetWidth || canvas.width;
  const columnWidth = canvasWidth / totalColumns;

  console.log('[CrewCal] Detected:', { month, year, daysInMonth, totalColumns, canvasWidth, columnWidth });

  return {
    anchorElement: container,
    canvasWidth,
    totalColumns,
    columnWidth,
    daysInMonth,
    month,
    year,
  };
}

function readMonthYear(): { month: number; year: number } {
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  const selects = document.querySelectorAll('select');
  for (const sel of selects) {
    const text = sel.value || sel.options?.[sel.selectedIndex]?.text || '';
    const parsed = parseMonthFromText(text);
    if (parsed) {
      month = parsed.month;
      year = parsed.year;
      break;
    }
  }

  return { month, year };
}

function calculateTotalColumns(year: number, month: number, daysInMonth: number): number {
  const lastDay = new Date(year, month - 1, daysInMonth);
  const lastDayWeekday = lastDay.getDay();
  // Monday-based: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const lastDayMondayBased = lastDayWeekday === 0 ? 6 : lastDayWeekday - 1;

  // The display shows overflow days to complete the partial week through Thursday
  if (lastDayMondayBased >= 3) {
    return daysInMonth;
  }
  return daysInMonth + (3 - lastDayMondayBased);
}

const MONTH_NAMES: Record<string, number> = {
  januar: 1, februar: 2, 'märz': 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
  january: 1, february: 2, march: 3, may: 5, june: 6,
  july: 7, october: 10, december: 12,
};

function parseMonthFromText(text: string): { month: number; year: number } | null {
  const lower = text.toLowerCase().trim();
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    if (lower.includes(name)) {
      const yearMatch = /\d{4}/.exec(text);
      return {
        month: num,
        year: yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear(),
      };
    }
  }
  return null;
}
