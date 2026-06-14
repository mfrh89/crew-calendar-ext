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
  const leftOffset = detectLeftOffset(canvas, TOTAL_COLUMNS);
  const columnWidth = (canvasWidth - leftOffset) / TOTAL_COLUMNS;

  console.log('[CrewCal] Detected:', { month, year, daysInMonth, canvasWidth, leftOffset, columnWidth });

  return {
    anchorElement: container,
    canvasElement: canvas,
    canvasWidth,
    leftOffset,
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

let cachedLeftOffset: { offset: number; canvasW: number; canvasH: number } | null = null;

function detectLeftOffset(canvas: HTMLCanvasElement, totalColumns: number): number {
  const w = canvas.width;
  const h = canvas.height;

  if (cachedLeftOffset && cachedLeftOffset.canvasW === w && cachedLeftOffset.canvasH === h) {
    console.log('[CrewCal] Using cached left offset:', cachedLeftOffset.offset, 'px');
    return cachedLeftOffset.offset;
  }

  let ctx: CanvasRenderingContext2D | null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    return 0;
  }
  if (!ctx) return 0;

  if (w === 0 || h === 0) return 0;

  const startY = Math.floor(h * 0.35);
  const scanHeight = h - startY;
  if (scanHeight < 3) return 0;

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, startY, w, scanHeight);
  } catch {
    return 0;
  }
  const data = imageData.data;

  const darkRatio = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    let darkCount = 0;
    for (let row = 0; row < scanHeight; row++) {
      const idx = (row * w + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 100) darkCount++;
    }
    darkRatio[x] = darkCount / scanHeight;
  }

  const candidates: number[] = [];
  for (let x = 0; x < w; x++) {
    if (darkRatio[x] > 0.5) {
      if (candidates.length === 0 || x - candidates[candidates.length - 1] > 3) {
        candidates.push(x);
      }
    }
  }

  let bestOffset = 0;

  if (candidates.length >= 5) {
    const spacingCounts = new Map<number, number>();
    for (let i = 1; i < candidates.length; i++) {
      const s = candidates[i] - candidates[i - 1];
      if (s >= 15 && s <= 50) {
        spacingCounts.set(s, (spacingCounts.get(s) || 0) + 1);
      }
    }

    let modeSpacing = 0;
    let maxCount = 0;
    for (const [s, c] of spacingCounts) {
      if (c > maxCount) { modeSpacing = s; maxCount = c; }
    }

    if (modeSpacing > 0) {
      let sumSpacing = 0;
      let countSpacing = 0;
      for (let i = 1; i < candidates.length; i++) {
        const s = candidates[i] - candidates[i - 1];
        if (Math.abs(s - modeSpacing) <= 2) {
          sumSpacing += s;
          countSpacing++;
        }
      }
      const avgColWidth = countSpacing > 0 ? sumSpacing / countSpacing : modeSpacing;
      bestOffset = Math.max(0, Math.round(w - totalColumns * avgColWidth));
    }
  }

  const displayWidth = canvas.offsetWidth;
  if (displayWidth && displayWidth !== w) {
    bestOffset = Math.round(bestOffset * displayWidth / w);
  }

  cachedLeftOffset = { offset: bestOffset, canvasW: w, canvasH: h };
  console.log('[CrewCal] Detected left offset:', bestOffset, 'px (canvas:', w, 'x', h, ', display:', displayWidth, ', gridLines:', candidates.length, ')');
  return bestOffset;
}

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
