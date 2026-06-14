// Fallback data (used immediately while API fetch runs in background)
// Source: official state ministry websites
const FALLBACK: Record<number, Record<string, Array<[string, string]>>> = {
  2025: {
    BW: [['2025-04-11','2025-04-25'],['2025-06-10','2025-06-20'],['2025-07-31','2025-09-13'],['2025-10-27','2025-10-31'],['2025-12-22','2026-01-05']],
    BY: [['2025-03-03','2025-03-07'],['2025-04-14','2025-04-25'],['2025-06-10','2025-06-20'],['2025-08-01','2025-09-15'],['2025-10-27','2025-10-31'],['2025-12-22','2026-01-05']],
    BE: [['2025-01-27','2025-02-01'],['2025-04-14','2025-04-25'],['2025-07-24','2025-09-06'],['2025-10-20','2025-11-01'],['2025-12-22','2026-01-02']],
    BB: [['2025-01-27','2025-02-01'],['2025-04-14','2025-04-25'],['2025-07-24','2025-09-06'],['2025-10-20','2025-11-01'],['2025-12-22','2026-01-02']],
    HB: [['2025-03-10','2025-03-21'],['2025-07-03','2025-08-13'],['2025-10-13','2025-10-24'],['2025-12-22','2026-01-05']],
    HH: [['2025-03-10','2025-03-21'],['2025-07-17','2025-08-27'],['2025-10-06','2025-10-17'],['2025-12-19','2026-01-02']],
    HE: [['2025-04-14','2025-04-25'],['2025-07-07','2025-08-15'],['2025-10-06','2025-10-17'],['2025-12-22','2026-01-10']],
    MV: [['2025-02-03','2025-02-08'],['2025-04-14','2025-04-18'],['2025-07-07','2025-08-16'],['2025-10-06','2025-10-17'],['2025-12-22','2026-01-03']],
    NI: [['2025-01-30','2025-01-31'],['2025-03-10','2025-03-21'],['2025-07-03','2025-08-13'],['2025-10-06','2025-10-17'],['2025-12-22','2026-01-05']],
    NW: [['2025-04-14','2025-04-26'],['2025-07-07','2025-08-19'],['2025-10-13','2025-10-25'],['2025-12-22','2026-01-06']],
    RP: [['2025-04-14','2025-04-25'],['2025-07-07','2025-08-15'],['2025-10-13','2025-10-24'],['2025-12-22','2026-01-07']],
    SL: [['2025-02-17','2025-02-21'],['2025-04-14','2025-04-25'],['2025-07-07','2025-08-15'],['2025-10-20','2025-10-31'],['2025-12-22','2026-01-05']],
    SN: [['2025-02-17','2025-03-01'],['2025-04-14','2025-04-18'],['2025-07-21','2025-08-29'],['2025-10-06','2025-10-18'],['2025-12-22','2026-01-02']],
    ST: [['2025-02-17','2025-03-01'],['2025-04-14','2025-04-22'],['2025-07-21','2025-08-27'],['2025-10-06','2025-10-10'],['2025-12-22','2026-01-05']],
    SH: [['2025-03-10','2025-03-21'],['2025-07-17','2025-08-27'],['2025-10-06','2025-10-18'],['2025-12-22','2026-01-05']],
    TH: [['2025-02-17','2025-03-01'],['2025-04-14','2025-04-25'],['2025-07-28','2025-09-06'],['2025-10-20','2025-10-31'],['2025-12-22','2026-01-03']],
  },
  2026: {
    BW: [['2026-03-30','2026-04-10'],['2026-06-02','2026-06-12'],['2026-07-30','2026-09-12'],['2026-10-26','2026-10-30'],['2026-12-23','2027-01-08']],
    BY: [['2026-03-02','2026-03-06'],['2026-04-09','2026-04-24'],['2026-05-26','2026-06-05'],['2026-07-30','2026-09-14'],['2026-11-02','2026-11-06'],['2026-12-23','2027-01-08']],
    BE: [['2026-02-02','2026-02-07'],['2026-03-30','2026-04-10'],['2026-07-23','2026-09-05'],['2026-10-19','2026-10-31'],['2026-12-21','2027-01-02']],
    BB: [['2026-02-02','2026-02-07'],['2026-03-30','2026-04-10'],['2026-07-23','2026-09-05'],['2026-10-19','2026-10-31'],['2026-12-21','2027-01-02']],
    HB: [['2026-03-30','2026-04-10'],['2026-07-02','2026-08-12'],['2026-10-12','2026-10-23'],['2026-12-21','2027-01-05']],
    HH: [['2026-03-16','2026-03-27'],['2026-07-16','2026-08-26'],['2026-10-05','2026-10-16'],['2026-12-18','2027-01-01']],
    HE: [['2026-03-30','2026-04-10'],['2026-07-06','2026-08-14'],['2026-10-05','2026-10-16'],['2026-12-21','2027-01-09']],
    MV: [['2026-02-09','2026-02-14'],['2026-03-30','2026-04-03'],['2026-07-06','2026-08-15'],['2026-10-05','2026-10-16'],['2026-12-21','2027-01-02']],
    NI: [['2026-02-02','2026-02-06'],['2026-03-16','2026-03-27'],['2026-07-02','2026-08-12'],['2026-10-05','2026-10-16'],['2026-12-21','2027-01-05']],
    NW: [['2026-03-30','2026-04-11'],['2026-07-06','2026-08-18'],['2026-10-12','2026-10-24'],['2026-12-21','2027-01-06']],
    RP: [['2026-03-30','2026-04-10'],['2026-07-06','2026-08-14'],['2026-10-12','2026-10-23'],['2026-12-21','2027-01-08']],
    SL: [['2026-02-16','2026-02-20'],['2026-03-30','2026-04-10'],['2026-07-06','2026-08-14'],['2026-10-19','2026-10-30'],['2026-12-21','2027-01-05']],
    SN: [['2026-02-16','2026-02-27'],['2026-04-02','2026-04-10'],['2026-07-20','2026-08-28'],['2026-10-05','2026-10-17'],['2026-12-21','2027-01-02']],
    ST: [['2026-02-16','2026-02-27'],['2026-03-30','2026-04-10'],['2026-07-20','2026-08-26'],['2026-10-05','2026-10-09'],['2026-12-21','2027-01-05']],
    SH: [['2026-03-16','2026-03-27'],['2026-07-16','2026-08-26'],['2026-10-05','2026-10-17'],['2026-12-21','2027-01-05']],
    TH: [['2026-02-16','2026-02-27'],['2026-03-30','2026-04-10'],['2026-07-27','2026-09-05'],['2026-10-19','2026-10-30'],['2026-12-21','2027-01-02']],
  },
};

interface CachedData {
  fetchedAt: number;
  ranges: Array<{ start: string; end: string }>;
}

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RETRY_BACKOFF_MS = 60 * 60 * 1000; // don't retry failed fetches for 1 hour
const failedAt: Map<string, number> = new Map();

function fallbackRanges(state: string, year: number): Array<{ start: string; end: string }> {
  return (FALLBACK[year]?.[state] ?? []).map(([start, end]) => ({ start, end }));
}

async function fetchForYear(state: string, year: number): Promise<Array<{ start: string; end: string }>> {
  const cacheKey = `schoolHolidays_${state}_${year}`;

  // Return cached data if fresh
  try {
    const cached = await browser.storage.local.get(cacheKey);
    if (cached[cacheKey]) {
      const data = cached[cacheKey] as CachedData;
      if (Date.now() - data.fetchedAt < CACHE_TTL_MS) return data.ranges;
    }
  } catch {
    // storage unavailable — use fallback
    return fallbackRanges(state, year);
  }

  // Don't hammer API after recent failure
  const lastFail = failedAt.get(cacheKey);
  if (lastFail && Date.now() - lastFail < RETRY_BACKOFF_MS) {
    return fallbackRanges(state, year);
  }

  // Fetch via background script (avoids CORS issues in content scripts)
  try {
    const result = await browser.runtime.sendMessage({ type: 'FETCH_SCHOOL_HOLIDAYS', state, year }) as
      | { ok: true; ranges: Array<{ start: string; end: string }> }
      | { ok: false; error: string };

    if (!result?.ok) {
      console.warn('[CrewCal] School holidays API error:', result?.error);
      failedAt.set(cacheKey, Date.now());
      return fallbackRanges(state, year);
    }

    await browser.storage.local.set({
      [cacheKey]: { fetchedAt: Date.now(), ranges: result.ranges } satisfies CachedData,
    });
    return result.ranges;
  } catch (e) {
    console.warn('[CrewCal] School holidays fetch failed:', e);
    failedAt.set(cacheKey, Date.now());
    return fallbackRanges(state, year);
  }
}

function rangesToDays(
  ranges: Array<{ start: string; end: string }>,
  year: number,
  month: number,
): Set<number> {
  const days = new Set<number>();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, new Date(year, month, 0).getDate());

  for (const { start, end } of ranges) {
    const rangeStart = new Date(`${start}T00:00:00`);
    const rangeEnd = new Date(`${end}T00:00:00`);
    if (rangeEnd < monthStart || rangeStart > monthEnd) continue;

    const cur = new Date(Math.max(rangeStart.getTime(), monthStart.getTime()));
    const last = new Date(Math.min(rangeEnd.getTime(), monthEnd.getTime()));
    while (cur <= last) {
      days.add(cur.getDate());
      cur.setDate(cur.getDate() + 1);
    }
  }
  return days;
}

export async function getSchoolHolidayDaysInMonth(
  year: number,
  month: number,
  state: string,
): Promise<Set<number>> {
  try {
    const yearsToFetch = new Set([year]);
    if (month === 1) yearsToFetch.add(year - 1);
    if (month === 12) yearsToFetch.add(year + 1);

    const allRanges: Array<{ start: string; end: string }> = [];
    for (const y of yearsToFetch) {
      allRanges.push(...(await fetchForYear(state, y)));
    }
    return rangesToDays(allRanges, year, month);
  } catch (e) {
    console.warn('[CrewCal] getSchoolHolidayDaysInMonth error:', e);
    // Last resort: use fallback only
    const ranges = [
      ...fallbackRanges(state, year - 1),
      ...fallbackRanges(state, year),
      ...fallbackRanges(state, year + 1),
    ];
    return rangesToDays(ranges, year, month);
  }
}
