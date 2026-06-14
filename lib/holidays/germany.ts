export const BUNDESLAENDER: Record<string, string> = {
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
};

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function shift(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function key(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns Wednesday before Nov 23 (Buß- und Bettag, only Sachsen)
function bussUndBettag(year: number): Date {
  const nov23 = new Date(year, 10, 23);
  const dow = nov23.getDay(); // 0=Sun
  // Go back to Wednesday (3)
  const daysBack = (dow >= 3) ? dow - 3 : dow + 4;
  return shift(nov23, -daysBack);
}

export function getHolidays(year: number, state: string): Set<string> {
  const easter = easterSunday(year);
  const set = new Set<string>();

  const add = (d: Date) => set.add(key(d));

  // Nationwide
  add(new Date(year, 0, 1));   // Neujahr
  add(shift(easter, -2));       // Karfreitag
  add(shift(easter, 1));        // Ostermontag
  add(new Date(year, 4, 1));   // Tag der Arbeit
  add(shift(easter, 39));       // Christi Himmelfahrt
  add(shift(easter, 50));       // Pfingstmontag
  add(new Date(year, 9, 3));   // Tag der Deutschen Einheit
  add(new Date(year, 11, 25)); // 1. Weihnachtstag
  add(new Date(year, 11, 26)); // 2. Weihnachtstag

  // Heilige Drei Könige
  if (['BW', 'BY', 'ST'].includes(state)) {
    add(new Date(year, 0, 6));
  }

  // Internationaler Frauentag
  if (['BE', 'MV'].includes(state)) {
    add(new Date(year, 2, 8));
  }

  // Gründonnerstag (only BB)
  if (state === 'BB') {
    add(shift(easter, -3));
  }

  // Fronleichnam
  if (['BW', 'BY', 'HE', 'NW', 'RP', 'SL'].includes(state)) {
    add(shift(easter, 60));
  }

  // Maria Himmelfahrt
  if (['BY', 'SL'].includes(state)) {
    add(new Date(year, 7, 15));
  }

  // Weltkindertag (TH, seit 2019)
  if (state === 'TH' && year >= 2019) {
    add(new Date(year, 8, 20));
  }

  // Reformationstag
  if (['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'].includes(state)) {
    add(new Date(year, 9, 31));
  }

  // Allerheiligen
  if (['BW', 'BY', 'NW', 'RP', 'SL'].includes(state)) {
    add(new Date(year, 10, 1));
  }

  // Buß- und Bettag (only SN)
  if (state === 'SN') {
    add(bussUndBettag(year));
  }

  return set;
}

/**
 * Returns a Set of day-numbers (1–31) that are holidays in the given month/year/state.
 */
export function getHolidayDaysInMonth(year: number, month: number, state: string): Set<number> {
  const holidays = getHolidays(year, state);
  const days = new Set<number>();
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const k = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (holidays.has(k)) days.add(d);
  }
  return days;
}
