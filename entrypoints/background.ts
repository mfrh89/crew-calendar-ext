import { settingsStorage, syncStateStorage } from '@/lib/storage/settings';
import { saveEvents, clearOldEvents } from '@/lib/storage/events';
import { fetchICSEvents } from '@/lib/caldav/client';
import type { BackgroundMessage } from '@/lib/types';

const ALARM_NAME = 'crew-calendar-sync';

export default defineBackground(() => {
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) syncAll();
  });

  browser.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    if (message.type === 'SYNC_NOW') {
      syncAll().then(() => sendResponse({ ok: true }));
      return true;
    }

    if (message.type === 'TEST_ICS') {
      testICS(message.url).then(sendResponse);
      return true;
    }

    return false;
  });

  setupAlarm();
  syncAll();
});

async function setupAlarm(): Promise<void> {
  const settings = await settingsStorage.getValue();
  await browser.alarms.clear(ALARM_NAME);
  await browser.alarms.create(ALARM_NAME, {
    periodInMinutes: settings.syncIntervalMinutes,
  });
}

async function testICS(url: string) {
  try {
    const events = await fetchICSEvents(url, '#4285f4', 'Test');
    return { success: true, eventCount: events.length };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function syncAll(): Promise<void> {
  const settings = await settingsStorage.getValue();
  if (settings.calendarSources.length === 0) return;

  await syncStateStorage.setValue({ lastSync: null, status: 'syncing' });

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const allEvents = [];
    const errors: string[] = [];
    for (const source of settings.calendarSources) {
      try {
        const events = await fetchICSEvents(source.url, source.color, source.name);
        allEvents.push(...events);
      } catch (e) {
        console.warn('[CrewCal] Sync failed for', source.name, e);
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    const monthKeys = new Set<string>();
    for (const ev of allEvents) {
      const start = new Date(ev.dtstart);
      const end = new Date(ev.dtend);
      for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
        monthKeys.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
      }
    }

    for (const key of monthKeys) {
      const [y, m] = key.split('-').map(Number);
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0, 23, 59, 59);

      const monthEvents = allEvents.filter((ev) => {
        const start = new Date(ev.dtstart);
        const end = new Date(ev.dtend);
        return start <= monthEnd && end >= monthStart;
      });

      await saveEvents(y, m, monthEvents);
    }

    await clearOldEvents(year, month);

    if (errors.length > 0 && allEvents.length === 0) {
      await syncStateStorage.setValue({
        lastSync: null,
        status: 'error',
        error: errors.join(' | '),
      });
    } else {
      await syncStateStorage.setValue({
        lastSync: new Date().toISOString(),
        status: errors.length > 0 ? 'error' : 'idle',
        error: errors.length > 0 ? errors.join(' | ') : undefined,
      });
    }
  } catch (e) {
    await syncStateStorage.setValue({
      lastSync: null,
      status: 'error',
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
