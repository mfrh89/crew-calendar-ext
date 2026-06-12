import { storage } from 'wxt/utils/storage';
import type { Settings, SyncState, CalendarInfo } from '../types';

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  defaultValue: {
    targetUrl: '',
    syncIntervalMinutes: 30,
    selectedCalendarUrls: [],
    stripPosition: 'below',
  },
});

export const syncStateStorage = storage.defineItem<SyncState>('local:syncState', {
  defaultValue: {
    lastSync: null,
    status: 'idle',
  },
});

export const calendarsStorage = storage.defineItem<CalendarInfo[]>('local:calendars', {
  defaultValue: [],
});
