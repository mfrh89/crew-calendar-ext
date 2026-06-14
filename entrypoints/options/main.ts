import { settingsStorage } from '@/lib/storage/settings';
import { BUNDESLAENDER } from '@/lib/holidays/germany';
import type { CalendarSource, HolidayStateConfig } from '@/lib/types';

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

const publicHolidayListEl = $<HTMLDivElement>('publicHolidayList');
const newPublicStateSelect = $<HTMLSelectElement>('newPublicState');
const newPublicColorInput = $<HTMLInputElement>('newPublicColor');
const addPublicHolidayBtn = $<HTMLButtonElement>('addPublicHoliday');

const schoolHolidayListEl = $<HTMLDivElement>('schoolHolidayList');
const newSchoolStateSelect = $<HTMLSelectElement>('newSchoolState');
const newSchoolColorInput = $<HTMLInputElement>('newSchoolColor');
const addSchoolHolidayBtn = $<HTMLButtonElement>('addSchoolHoliday');

let calendarSources: CalendarSource[] = [];
let publicHolidayStates: HolidayStateConfig[] = [];
let schoolHolidayStates: HolidayStateConfig[] = [];
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

async function save() {
  const current = await settingsStorage.getValue();
  await settingsStorage.setValue({
    enabled: current.enabled,
    calendarSources,
    targetUrl: targetUrlInput.value.trim(),
    syncIntervalMinutes: parseInt(syncIntervalSelect.value, 10),
    stripPosition: stripPositionSelect.value as 'above' | 'below',
    publicHolidayStates,
    schoolHolidayStates,
  });

  await browser.runtime.sendMessage({ type: 'SYNC_NOW' });

  saveStatusEl.textContent = 'Saved!';
  setTimeout(() => { saveStatusEl.textContent = ''; }, 2000);
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveStatusEl.textContent = '...';
  saveTimeout = setTimeout(save, 800);
}

async function init() {
  const settings = await settingsStorage.getValue();
  calendarSources = [...settings.calendarSources];
  publicHolidayStates = [...(settings.publicHolidayStates ?? [])];
  schoolHolidayStates = [...(settings.schoolHolidayStates ?? [])];
  targetUrlInput.value = settings.targetUrl;
  stripPositionSelect.value = settings.stripPosition;
  syncIntervalSelect.value = String(settings.syncIntervalMinutes);
  renderCalendars();
  renderHolidayList(publicHolidayListEl, publicHolidayStates, () => renderHolidayList(publicHolidayListEl, publicHolidayStates, () => {}));
  renderHolidayList(schoolHolidayListEl, schoolHolidayStates, () => renderHolidayList(schoolHolidayListEl, schoolHolidayStates, () => {}));
}

function renderCalendars() {
  calendarListEl.innerHTML = '';
  for (let i = 0; i < calendarSources.length; i++) {
    const src = calendarSources[i];
    const item = document.createElement('div');
    item.className = 'cal-item';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'cal-color-input';
    colorInput.value = src.color;
    colorInput.addEventListener('input', () => {
      calendarSources[i].color = colorInput.value;
      scheduleSave();
    });

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'cal-name-input';
    nameInput.value = src.name || 'Calendar';
    nameInput.addEventListener('input', () => {
      calendarSources[i].name = nameInput.value;
      scheduleSave();
    });

    const url = document.createElement('span');
    url.className = 'cal-url';
    url.textContent = src.url;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cal-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      calendarSources.splice(i, 1);
      renderCalendars();
      scheduleSave();
    });

    item.append(colorInput, nameInput, url, removeBtn);
    calendarListEl.appendChild(item);
  }
}

function renderHolidayList(
  container: HTMLDivElement,
  list: HolidayStateConfig[],
  onChange: () => void,
) {
  container.innerHTML = '';
  for (let i = 0; i < list.length; i++) {
    const cfg = list[i];
    const item = document.createElement('div');
    item.className = 'cal-item';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'cal-color-input';
    colorInput.value = cfg.color;
    colorInput.addEventListener('input', () => {
      list[i].color = colorInput.value;
      scheduleSave();
    });

    const label = document.createElement('span');
    label.className = 'cal-name-input';
    label.style.cssText = 'flex:1; padding: 4px 6px; font-size:13px; font-weight:500;';
    label.textContent = BUNDESLAENDER[cfg.state] ?? cfg.state;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cal-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      list.splice(i, 1);
      onChange();
      scheduleSave();
    });

    item.append(colorInput, label, removeBtn);
    container.appendChild(item);
  }
}

async function requestHostPermission(url: string): Promise<boolean> {
  try {
    const httpsUrl = url.replace(/^webcal:\/\//, 'https://');
    const origin = new URL(httpsUrl).origin + '/*';
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
  scheduleSave();
});

addPublicHolidayBtn.addEventListener('click', () => {
  const state = newPublicStateSelect.value;
  if (!state) return;
  if (publicHolidayStates.some(s => s.state === state)) return;
  publicHolidayStates.push({ state, color: newPublicColorInput.value });
  newPublicStateSelect.value = '';
  renderHolidayList(publicHolidayListEl, publicHolidayStates, () => renderHolidayList(publicHolidayListEl, publicHolidayStates, () => {}));
  scheduleSave();
});

addSchoolHolidayBtn.addEventListener('click', () => {
  const state = newSchoolStateSelect.value;
  if (!state) return;
  if (schoolHolidayStates.some(s => s.state === state)) return;
  schoolHolidayStates.push({ state, color: newSchoolColorInput.value });
  newSchoolStateSelect.value = '';
  renderHolidayList(schoolHolidayListEl, schoolHolidayStates, () => renderHolidayList(schoolHolidayListEl, schoolHolidayStates, () => {}));
  scheduleSave();
});

targetUrlInput.addEventListener('input', scheduleSave);
stripPositionSelect.addEventListener('change', scheduleSave);
syncIntervalSelect.addEventListener('change', scheduleSave);

saveBtn.addEventListener('click', () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  save();
});

function showStatus(el: HTMLElement, message: string, type: 'success' | 'error') {
  el.textContent = message;
  el.className = `status ${type}`;
  el.hidden = false;
}

init();
