export interface CalDAVConfig {
  serverUrl: string;
  username: string;
  password: string;
  authMethod: 'Basic' | 'OAuth';
}

export interface CalendarInfo {
  url: string;
  displayName: string;
  color: string;
}

export interface CalendarEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location?: string;
  description?: string;
  calendarUrl: string;
  calendarColor: string;
  isAllDay: boolean;
}

export interface Settings {
  targetUrl: string;
  syncIntervalMinutes: number;
  selectedCalendarUrls: string[];
  stripPosition: 'above' | 'below';
  customSelector?: string;
}

export interface SyncState {
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
}

export type BackgroundMessage =
  | { type: 'SYNC_NOW' }
  | { type: 'SYNC_STATUS'; payload: SyncState }
  | { type: 'TEST_CONNECTION'; payload: CalDAVConfig }
  | { type: 'TEST_CONNECTION_RESULT'; success: boolean; calendars?: CalendarInfo[]; error?: string }
  | { type: 'EVENTS_UPDATED'; month: string };
