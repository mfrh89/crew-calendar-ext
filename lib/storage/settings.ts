import { storage } from 'wxt/utils/storage';
import type { Settings, SyncState } from '../types';

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  defaultValue: {
    enabled: true,
    calendarSources: [],
    targetUrl: 'https://cra.cms.lhgroup.de/*',
    syncIntervalMinutes: 30,
    publicHolidayStates: [],
    schoolHolidayStates: [],
  },
});

export const syncStateStorage = storage.defineItem<SyncState>('local:syncState', {
  defaultValue: {
    lastSync: null,
    status: 'idle',
  },
});
