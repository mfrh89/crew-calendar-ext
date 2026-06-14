import { storage } from 'wxt/utils/storage';
import type { Settings, SyncState } from '../types';

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  defaultValue: {
    enabled: true,
    calendarSources: [],
    targetUrl: '',
    syncIntervalMinutes: 30,
    stripPosition: 'below',
    holidayState: null,
  },
});

export const syncStateStorage = storage.defineItem<SyncState>('local:syncState', {
  defaultValue: {
    lastSync: null,
    status: 'idle',
  },
});
