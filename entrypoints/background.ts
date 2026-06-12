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
    const events = await fetchICSEvents(url, '#4285f4');
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
    for (const source of settings.calendarSources) {
      const events = await fetchICSEvents(source.url, source.color);
      allEvents.push(...events);
    }

    const monthsToStore = [
      { y: month === 1 ? year - 1 : year, m: month === 1 ? 12 : month - 1 },
      { y: year, m: month },
      { y: month === 12 ? year + 1 : year, m: month === 12 ? 1 : month + 1 },
    ];

    for (const { y, m } of monthsToStore) {
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
    await syncStateStorage.setValue({
      lastSync: new Date().toISOString(),
      status: 'idle',
    });
  } catch (e) {
    await syncStateStorage.setValue({
      lastSync: null,
      status: 'error',
      error: String(e),
    });
  }
}
