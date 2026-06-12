const DAY_PATTERN = /^(Mo|Di|Mi|Do|Fr|Sa|So)\s*(\d{1,2})$/;
const KNOWN_IDS = ['calenderAndRosterLine'];

export interface DayBarInfo {
  container: HTMLElement;
  cells: HTMLElement[];
  month: number;
  year: number;
}

export function detectDayBar(customSelector?: string): DayBarInfo | null {
  if (customSelector) {
    const el = document.querySelector<HTMLElement>(customSelector);
    if (el) {
      const cells = findDayCells(el);
      if (cells) return buildDayBarInfo(el, cells);
    }
  }

  for (const id of KNOWN_IDS) {
    const el = document.getElementById(id);
    if (el) {
      const cells = findDayCells(el);
      if (cells) return buildDayBarInfo(el, cells);
    }
  }

  return detectAutomatically();
}

function detectAutomatically(): DayBarInfo | null {
  const candidates = [
    ...document.querySelectorAll<HTMLElement>('tr'),
    ...document.querySelectorAll<HTMLElement>('[class*="row"], [class*="bar"], [class*="day"]'),
  ];

  for (const candidate of candidates) {
    const cells = findDayCells(candidate);
    if (cells) return buildDayBarInfo(candidate, cells);
  }

  return null;
}

function findDayCells(container: HTMLElement): HTMLElement[] | null {
  const children = Array.from(container.querySelectorAll<HTMLElement>('td, th, div > div, span'));
  if (children.length < 28) {
    const directChildren = Array.from(container.children) as HTMLElement[];
    if (directChildren.length >= 28) {
      return matchDayCells(directChildren);
    }
    return matchDayCells(children);
  }
  return matchDayCells(children);
}

function matchDayCells(elements: HTMLElement[]): HTMLElement[] | null {
  const matched: { el: HTMLElement; day: number }[] = [];

  for (const child of elements) {
    const text = (child.textContent ?? '').trim().replace(/\s+/g, ' ');
    const match = DAY_PATTERN.exec(text);
    if (match) {
      matched.push({ el: child, day: parseInt(match[2], 10) });
    }
  }

  if (matched.length < 28) return null;

  matched.sort((a, b) => a.day - b.day);
  if (matched[0].day !== 1) return null;

  for (let i = 1; i < matched.length; i++) {
    if (matched[i].day !== matched[i - 1].day + 1) return null;
  }

  return matched.map((m) => m.el);
}

function buildDayBarInfo(
  container: HTMLElement,
  cells: HTMLElement[],
): DayBarInfo {
  const daysInMonth = cells.length;

  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;

  const monthSelect = document.querySelector<HTMLSelectElement>(
    'select[name*="monat" i], select[name*="month" i], select',
  );

  if (monthSelect) {
    const val = monthSelect.value || monthSelect.textContent || '';
    const parsed = parseMonthFromText(val);
    if (parsed) {
      month = parsed.month;
      year = parsed.year;
    }
  } else {
    const pageText = document.body.textContent ?? '';
    const parsed = parseMonthFromText(pageText);
    if (parsed) {
      month = parsed.month;
      year = parsed.year;
    } else {
      month = guessMonthFromDayCount(daysInMonth, year);
    }
  }

  return { container, cells, month, year };
}

const MONTH_NAMES: Record<string, number> = {
  januar: 1, februar: 2, 'märz': 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
  january: 1, february: 2, march: 3, may: 5, june: 6,
  july: 7, october: 10, december: 12,
};

function parseMonthFromText(
  text: string,
): { month: number; year: number } | null {
  const lower = text.toLowerCase();

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

function guessMonthFromDayCount(days: number, year: number): number {
  const now = new Date();
  for (let offset = -1; offset <= 1; offset++) {
    const m = now.getMonth() + 1 + offset;
    const daysInMonth = new Date(year, m, 0).getDate();
    if (daysInMonth === days) return m;
  }
  return now.getMonth() + 1;
}
