import type { DayBarInfo } from '../types';

const CANVAS_ID = 'calendarAndRosterLine';
const CONTAINER_ID = 'calendarAndRosterLineContainer';
const MONTH_SELECT_ID = 'sel_month';
const TOTAL_COLUMNS = 32;

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
  const canvasWidth = canvas.offsetWidth || canvas.width;
  const columnWidth = canvasWidth / TOTAL_COLUMNS;

  console.log('[CrewCal] Detected:', { month, year, daysInMonth, canvasWidth, columnWidth });

  return {
    anchorElement: container,
    canvasWidth,
    totalColumns: TOTAL_COLUMNS,
    columnWidth,
    daysInMonth,
    month,
    year,
  };
}

export function watchMonthSelect(onChange: () => void): void {
  const sel = document.getElementById(MONTH_SELECT_ID);
  if (sel) {
    sel.addEventListener('change', () => {
      console.log('[CrewCal] Month select changed');
      setTimeout(onChange, 500);
    });
  }
}

function readMonthYear(): { month: number; year: number } {
  const now = new Date();

  const monthSelect = document.getElementById(MONTH_SELECT_ID) as HTMLSelectElement | null;
  if (monthSelect) {
    const text = monthSelect.options?.[monthSelect.selectedIndex]?.text
                 ?? monthSelect.value ?? '';
    console.log('[CrewCal] Month select text:', text);
    const parsed = parseMonthFromText(text);
    if (parsed) return parsed;
  }

  const selects = document.querySelectorAll('select');
  for (const sel of selects) {
    if (sel.id === MONTH_SELECT_ID) continue;
    const text = sel.options?.[sel.selectedIndex]?.text ?? sel.value ?? '';
    const parsed = parseMonthFromText(text);
    if (parsed) return parsed;
  }

  return { month: now.getMonth() + 1, year: now.getFullYear() };
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
