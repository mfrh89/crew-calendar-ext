export interface CalendarSource {
  url: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location?: string;
  description?: string;
  sourceUrl: string;
  sourceName: string;
  color: string;
  isAllDay: boolean;
}

export interface DayBarInfo {
  anchorElement: HTMLElement;
  canvasElement: HTMLCanvasElement;
  canvasWidth: number;
  leftOffset: number;
  totalColumns: number;
  columnWidth: number;
  daysInMonth: number;
  month: number;
  year: number;
}

export interface Settings {
  enabled: boolean;
  calendarSources: CalendarSource[];
  targetUrl: string;
  syncIntervalMinutes: number;
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
  | { type: 'TEST_ICS'; url: string }
  | { type: 'TEST_ICS_RESULT'; success: boolean; name?: string; eventCount?: number; error?: string };
