import { settingsStorage } from '@/lib/storage/settings';
import type { CalendarSource } from '@/lib/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const calendarListEl = $<HTMLDivElement>('calendarList');
const newCalUrlInput = $<HTMLInputElement>('newCalUrl');
const newCalNameInput = $<HTMLInputElement>('newCalName');
const newCalColorInput = $<HTMLInputElement>('newCalColor');
const testUrlBtn = $<HTMLButtonElement>('testUrl');
const addCalBtn = $<HTMLButtonElement>('addCal');
const testStatusEl = $<HTMLDivElement>('testStatus');
const targetUrlInput = $<HTMLInputElement>('targetUrl');
const stripPositionSelect = $<HTMLSelectElement>('stripPosition');
const syncIntervalSelect = $<HTMLSelectElement>('syncInterval');
const saveBtn = $<HTMLButtonElement>('save');
const saveStatusEl = $<HTMLSpanElement>('saveStatus');

let calendarSources: CalendarSource[] = [];

async function init() {
  const settings = await settingsStorage.getValue();
  calendarSources = [...settings.calendarSources];
  targetUrlInput.value = settings.targetUrl;
  stripPositionSelect.value = settings.stripPosition;
  syncIntervalSelect.value = String(settings.syncIntervalMinutes);
  renderCalendars();
}

function renderCalendars() {
  calendarListEl.innerHTML = '';
  for (let i = 0; i < calendarSources.length; i++) {
    const src = calendarSources[i];
    const item = document.createElement('div');
    item.className = 'cal-item';

    const dot = document.createElement('div');
    dot.className = 'cal-color';
    dot.style.background = src.color;

    const name = document.createElement('span');
    name.className = 'cal-name';
    name.textContent = src.name || 'Calendar';

    const url = document.createElement('span');
    url.className = 'cal-url';
    url.textContent = src.url;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cal-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      calendarSources.splice(i, 1);
      renderCalendars();
    });

    item.append(dot, name, url, removeBtn);
    calendarListEl.appendChild(item);
  }
}

async function requestHostPermission(url: string): Promise<boolean> {
  try {
    const origin = new URL(url).origin + '/*';
    return await browser.permissions.request({ origins: [origin] });
  } catch {
    return false;
  }
}

testUrlBtn.addEventListener('click', async () => {
  const url = newCalUrlInput.value.trim();
  if (!url) return;

  const granted = await requestHostPermission(url);
  if (!granted) {
    showStatus(testStatusEl, 'Permission denied. The extension needs access to fetch this URL.', 'error');
    return;
  }

  testUrlBtn.disabled = true;
  testUrlBtn.textContent = '...';
  testStatusEl.hidden = true;

  const response = await browser.runtime.sendMessage({ type: 'TEST_ICS', url });

  testUrlBtn.disabled = false;
  testUrlBtn.textContent = 'Test';

  if (response.success) {
    showStatus(testStatusEl, `OK - ${response.eventCount} events found.`, 'success');
  } else {
    showStatus(testStatusEl, `Failed: ${response.error}`, 'error');
  }
});

addCalBtn.addEventListener('click', async () => {
  const url = newCalUrlInput.value.trim();
  if (!url) return;

  await requestHostPermission(url);

  calendarSources.push({
    url,
    name: newCalNameInput.value.trim() || 'Calendar',
    color: newCalColorInput.value,
  });

  newCalUrlInput.value = '';
  newCalNameInput.value = '';
  testStatusEl.hidden = true;
  renderCalendars();
});

saveBtn.addEventListener('click', async () => {
  await settingsStorage.setValue({
    calendarSources,
    targetUrl: targetUrlInput.value.trim(),
    syncIntervalMinutes: parseInt(syncIntervalSelect.value, 10),
    stripPosition: stripPositionSelect.value as 'above' | 'below',
  });

  await browser.runtime.sendMessage({ type: 'SYNC_NOW' });

  saveStatusEl.textContent = 'Saved!';
  setTimeout(() => { saveStatusEl.textContent = ''; }, 2000);
});

function showStatus(el: HTMLElement, message: string, type: 'success' | 'error') {
  el.textContent = message;
  el.className = `status ${type}`;
  el.hidden = false;
}

init();
