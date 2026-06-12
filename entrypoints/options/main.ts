import { saveCredentials, loadCredentials } from '@/lib/storage/credentials';
import { settingsStorage, calendarsStorage } from '@/lib/storage/settings';
import type { CalendarInfo } from '@/lib/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const serverUrlInput = $<HTMLInputElement>('serverUrl');
const usernameInput = $<HTMLInputElement>('username');
const passwordInput = $<HTMLInputElement>('password');
const testBtn = $<HTMLButtonElement>('testConnection');
const connectionStatus = $<HTMLDivElement>('connectionStatus');
const calendarsSection = $<HTMLElement>('calendarsSection');
const calendarList = $<HTMLDivElement>('calendarList');
const targetUrlInput = $<HTMLInputElement>('targetUrl');
const stripPositionSelect = $<HTMLSelectElement>('stripPosition');
const syncIntervalSelect = $<HTMLSelectElement>('syncInterval');
const saveBtn = $<HTMLButtonElement>('save');
const saveStatus = $<HTMLSpanElement>('saveStatus');

async function init() {
  const creds = await loadCredentials();
  if (creds) {
    serverUrlInput.value = creds.serverUrl;
    usernameInput.value = creds.username;
    passwordInput.value = creds.password;
  }

  const settings = await settingsStorage.getValue();
  targetUrlInput.value = settings.targetUrl;
  stripPositionSelect.value = settings.stripPosition;
  syncIntervalSelect.value = String(settings.syncIntervalMinutes);

  const calendars = await calendarsStorage.getValue();
  if (calendars.length > 0) {
    renderCalendars(calendars, settings.selectedCalendarUrls);
    calendarsSection.hidden = false;
  }
}

function renderCalendars(calendars: CalendarInfo[], selected: string[]) {
  calendarList.innerHTML = '';
  for (const cal of calendars) {
    const item = document.createElement('div');
    item.className = 'calendar-item';

    const colorDot = document.createElement('div');
    colorDot.className = 'calendar-color';
    colorDot.style.background = cal.color;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = cal.url;
    checkbox.checked = selected.includes(cal.url);
    checkbox.id = `cal-${cal.url}`;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = cal.displayName;

    item.append(checkbox, colorDot, label);
    calendarList.appendChild(item);
  }
}

testBtn.addEventListener('click', async () => {
  const serverUrl = serverUrlInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!serverUrl || !username || !password) {
    showStatus(connectionStatus, 'Please fill in all fields.', 'error');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  connectionStatus.hidden = true;

  const response = await browser.runtime.sendMessage({
    type: 'TEST_CONNECTION',
    payload: { serverUrl, username, password, authMethod: 'Basic' },
  });

  testBtn.disabled = false;
  testBtn.textContent = 'Test Connection';

  if (response.success) {
    const calendars = response.calendars as CalendarInfo[];
    await calendarsStorage.setValue(calendars);

    const settings = await settingsStorage.getValue();
    const selected = settings.selectedCalendarUrls.length > 0
      ? settings.selectedCalendarUrls
      : calendars.map((c) => c.url);

    renderCalendars(calendars, selected);
    calendarsSection.hidden = false;

    showStatus(connectionStatus, `Connected. Found ${calendars.length} calendar(s).`, 'success');
  } else {
    showStatus(connectionStatus, `Connection failed: ${response.error}`, 'error');
  }
});

saveBtn.addEventListener('click', async () => {
  const serverUrl = serverUrlInput.value.trim();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (serverUrl && username && password) {
    await saveCredentials({
      serverUrl,
      username,
      password,
      authMethod: 'Basic',
    });
  }

  const selectedCalendarUrls = Array.from(
    calendarList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'),
  ).map((cb) => cb.value);

  await settingsStorage.setValue({
    targetUrl: targetUrlInput.value.trim(),
    syncIntervalMinutes: parseInt(syncIntervalSelect.value, 10),
    selectedCalendarUrls,
    stripPosition: stripPositionSelect.value as 'above' | 'below',
  });

  await browser.runtime.sendMessage({ type: 'SYNC_NOW' });

  saveStatus.textContent = 'Saved!';
  setTimeout(() => { saveStatus.textContent = ''; }, 2000);
});

function showStatus(el: HTMLElement, message: string, type: 'success' | 'error') {
  el.textContent = message;
  el.className = `status ${type}`;
  el.hidden = false;
}

init();
