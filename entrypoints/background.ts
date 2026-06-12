import { loadCredentials } from '@/lib/storage/credentials';
import { settingsStorage, syncStateStorage, calendarsStorage } from '@/lib/storage/settings';
import { saveEvents, clearOldEvents } from '@/lib/storage/events';
import { connectAndFetchCalendars, fetchEventsForMonth } from '@/lib/caldav/client';
import type { BackgroundMessage, CalDAVConfig } from '@/lib/types';

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

    if (message.type === 'TEST_CONNECTION') {
      testConnection(message.payload).then(sendResponse);
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

async function testConnection(config: CalDAVConfig) {
  try {
    const calendars = await connectAndFetchCalendars(config);
    return { success: true, calendars };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function syncAll(): Promise<void> {
  const credentials = await loadCredentials();
  if (!credentials) return;

  const settings = await settingsStorage.getValue();
  const selectedUrls = settings.selectedCalendarUrls;
  if (selectedUrls.length === 0) return;

  const calendars = await calendarsStorage.getValue();

  await syncStateStorage.setValue({ lastSync: null, status: 'syncing' });

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthsToSync = [
      { y: month === 1 ? year - 1 : year, m: month === 1 ? 12 : month - 1 },
      { y: year, m: month },
      { y: month === 12 ? year + 1 : year, m: month === 12 ? 1 : month + 1 },
    ];

    for (const { y, m } of monthsToSync) {
      const allEvents = [];

      for (const calUrl of selectedUrls) {
        const cal = calendars.find((c) => c.url === calUrl);
        const color = cal?.color ?? '#4285f4';

        const events = await fetchEventsForMonth(credentials, calUrl, color, y, m);
        allEvents.push(...events);
      }

      await saveEvents(y, m, allEvents);
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
