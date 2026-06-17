import { settingsStorage } from '@/lib/storage/settings';
import { BUNDESLAENDER } from '@/lib/holidays/germany';
import type { CalendarSource, HolidayStateConfig } from '@/lib/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const calendarListEl = $<HTMLDivElement>('calendarList');
const newCalUrlInput = $<HTMLInputElement>('newCalUrl');
const newCalNameInput = $<HTMLInputElement>('newCalName');
const testUrlBtn = $<HTMLButtonElement>('testUrl');
const addCalBtn = $<HTMLButtonElement>('addCal');
const testStatusEl = $<HTMLDivElement>('testStatus');
const targetUrlInput = $<HTMLInputElement>('targetUrl');
const saveBtn = $<HTMLButtonElement>('save');
const saveStatusEl = $<HTMLSpanElement>('saveStatus');

const publicHolidayListEl = $<HTMLDivElement>('publicHolidayList');
const newPublicStateSelect = $<HTMLSelectElement>('newPublicState');
const addPublicHolidayBtn = $<HTMLButtonElement>('addPublicHoliday');

const schoolHolidayListEl = $<HTMLDivElement>('schoolHolidayList');
const newSchoolStateSelect = $<HTMLSelectElement>('newSchoolState');
const addSchoolHolidayBtn = $<HTMLButtonElement>('addSchoolHoliday');

// 10 distinct, harmonious colors (Sanzo Wada inspired)
const PALETTE = [
  '#C8503C', // Vermilion
  '#C87C3A', // Amber
  '#A89B2A', // Olive gold
  '#5A8F3C', // Leaf green
  '#3A8A72', // Sea green
  '#3A6FA5', // Cerulean
  '#3A4F96', // Cobalt
  '#7A4FA5', // Violet
  '#A54A7A', // Mauve
  '#7A3A46', // Burgundy
];

let calendarSources: CalendarSource[] = [];
let publicHolidayStates: HolidayStateConfig[] = [];
let schoolHolidayStates: HolidayStateConfig[] = [];
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

let closeActivePicker: (() => void) | null = null;

function createSwatchPicker(container: HTMLElement, defaultColor: string): { getColor: () => string; setColor: (c: string) => void } {
  let selected = PALETTE.includes(defaultColor) ? defaultColor : PALETTE[0];
  let open = false;
  container.className = 'swatch-picker-wrap';

  function close() {
    open = false;
    render();
  }

  function render() {
    container.innerHTML = '';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'swatch-trigger';
    trigger.style.background = selected;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!open) {
        // Close any other open picker first
        if (closeActivePicker && closeActivePicker !== close) closeActivePicker();
        closeActivePicker = close;
      } else {
        closeActivePicker = null;
      }
      open = !open;
      render();
    });
    container.appendChild(trigger);

    if (open) {
      const dropdown = document.createElement('div');
      dropdown.className = 'swatch-dropdown';
      for (const color of PALETTE) {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'swatch' + (color === selected ? ' selected' : '');
        swatch.style.background = color;
        swatch.addEventListener('click', (e) => {
          e.stopPropagation();
          selected = color;
          open = false;
          closeActivePicker = null;
          render();
        });
        dropdown.appendChild(swatch);
      }
      container.appendChild(dropdown);

      // Close on outside click
      const outsideClose = () => { open = false; closeActivePicker = null; render(); document.removeEventListener('click', outsideClose); };
      setTimeout(() => document.addEventListener('click', outsideClose), 0);
    }
  }

  render();
  return {
    getColor: () => selected,
    setColor: (c: string) => { selected = PALETTE.includes(c) ? c : PALETTE[0]; open = false; render(); },
  };
}

const calColorPicker = createSwatchPicker($('newCalColorPicker'), PALETTE[6]);
const publicColorPicker = createSwatchPicker($('newPublicColorPicker'), PALETTE[2]);
const schoolColorPicker = createSwatchPicker($('newSchoolColorPicker'), PALETTE[4]);

async function save() {
  const current = await settingsStorage.getValue();
  await settingsStorage.setValue({
    enabled: current.enabled,
    calendarSources,
    targetUrl: targetUrlInput.value.trim(),
    syncIntervalMinutes: 30,
    publicHolidayStates,
    schoolHolidayStates,
  });

  try { await browser.runtime.sendMessage({ type: 'SYNC_NOW' }); } catch { /* service worker may be inactive */ }

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
  renderCalendars();
  renderPublicHolidays();
  renderSchoolHolidays();
}

function renderCalendars() {
  calendarListEl.innerHTML = '';
  for (let i = 0; i < calendarSources.length; i++) {
    const src = calendarSources[i];
    const item = document.createElement('div');
    item.className = 'cal-item';

    const colorDot = document.createElement('span');
    colorDot.className = 'cal-color-dot';
    colorDot.style.background = src.color;

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

    item.append(colorDot, nameInput, url, removeBtn);
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

    const colorDot = document.createElement('span');
    colorDot.className = 'cal-color-dot';
    colorDot.style.background = cfg.color;

    const label = document.createElement('span');
    label.style.cssText = 'flex:1; padding: 4px 6px; font-size:13px; font-weight:600; color:#05164D;';
    label.textContent = BUNDESLAENDER[cfg.state] ?? cfg.state;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cal-remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      list.splice(i, 1);
      onChange();
      scheduleSave();
    });

    item.append(colorDot, label, removeBtn);
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
    color: calColorPicker.getColor(),
  });

  newCalUrlInput.value = '';
  newCalNameInput.value = '';
  testStatusEl.hidden = true;
  renderCalendars();
  scheduleSave();
});

function renderPublicHolidays() {
  renderHolidayList(publicHolidayListEl, publicHolidayStates, renderPublicHolidays);
}

function renderSchoolHolidays() {
  renderHolidayList(schoolHolidayListEl, schoolHolidayStates, renderSchoolHolidays);
}

addPublicHolidayBtn.addEventListener('click', () => {
  const state = newPublicStateSelect.value;
  if (!state) return;
  if (publicHolidayStates.some(s => s.state === state)) return;
  publicHolidayStates.push({ state, color: publicColorPicker.getColor() });
  newPublicStateSelect.value = '';
  renderPublicHolidays();
  scheduleSave();
});

addSchoolHolidayBtn.addEventListener('click', () => {
  const state = newSchoolStateSelect.value;
  if (!state) return;
  if (schoolHolidayStates.some(s => s.state === state)) return;
  schoolHolidayStates.push({ state, color: schoolColorPicker.getColor() });
  newSchoolStateSelect.value = '';
  renderSchoolHolidays();
  scheduleSave();
});

targetUrlInput.addEventListener('input', scheduleSave);

document.getElementById('helpLink')!.addEventListener('click', (e) => {
  e.preventDefault();
  browser.tabs.create({ url: browser.runtime.getURL('help.html') });
});

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
