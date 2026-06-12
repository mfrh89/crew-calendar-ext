import { storage } from 'wxt/utils/storage';
import type { Settings, SyncState } from '../types';

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  defaultValue: {
    calendarSources: [],
    targetUrl: '',
    syncIntervalMinutes: 30,
    stripPosition: 'below',
  },
});

export const syncStateStorage = storage.defineItem<SyncState>('local:syncState', {
  defaultValue: {
    lastSync: null,
    status: 'idle',
  },
});
