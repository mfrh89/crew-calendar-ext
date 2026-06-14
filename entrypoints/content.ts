import { detectDayBar, watchMonthSelect } from '@/lib/dom/detector';
import { injectStrip, removeStrip, injectBanner, removeBanner } from '@/lib/dom/injector';
import { observeDOMChanges } from '@/lib/dom/observer';
import { loadEvents } from '@/lib/storage/events';
import { settingsStorage } from '@/lib/storage/settings';
import { getHolidayDaysInMonth } from '@/lib/holidays/germany';
import type { CalendarEvent, DayBarInfo } from '@/lib/types';

const DAY_NAMES_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  async main() {
    const settings = await settingsStorage.getValue();

    console.log('[CrewCal] Content script loaded', {
      currentUrl: window.location.href,
      targetUrl: settings.targetUrl,
    });

    if (!settings.targetUrl) {
      console.log('[CrewCal] No target URL configured, skipping.');
      return;
    }

    if (!matchesTarget(window.location.href, settings.targetUrl)) {
      console.log('[CrewCal] URL does not match target pattern, skipping.');
      return;
    }

    console.log('[CrewCal] URL matched, looking for canvas day bar...');

    let currentDayBar: DayBarInfo | null = null;
    let modal: HTMLElement | null = null;
    let lastRenderKey = '';

    async function render(force = false) {
      const currentSettings = await settingsStorage.getValue();
      if (!currentSettings.enabled) {
        removeStrip();
        removeBanner();
        currentDayBar = null;
        lastRenderKey = '';
        return;
      }

      const dayBar = detectDayBar();
      if (!dayBar) {
        removeStrip();
        removeBanner();
        currentDayBar = null;
        lastRenderKey = '';
        return;
      }

      const renderKey = `${dayBar.year}-${dayBar.month}-${dayBar.canvasWidth}-${dayBar.leftOffset}`;
      const stripExists = !!document.getElementById('crew-calendar-strip');
      if (!force && stripExists && renderKey === lastRenderKey) return;

      currentDayBar = dayBar;
      lastRenderKey = renderKey;
      injectBanner(dayBar);
      const events = await loadEvents(dayBar.year, dayBar.month);
      const holidayDays = currentSettings.holidayState
        ? getHolidayDaysInMonth(dayBar.year, dayBar.month, currentSettings.holidayState)
        : new Set<number>();
      console.log('[CrewCal] Rendering', events.length, 'events for', dayBar.month + '/' + dayBar.year);
      injectStrip(dayBar, events, settings.stripPosition, showEventsModal, showEventsModal, holidayDays);
    }

    function showEventsModal(events: CalendarEvent[], day: number) {
      closeModal();

      const sorted = [...events].sort((a, b) => {
        if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
        return new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime();
      });

      const date = new Date(currentDayBar!.year, currentDayBar!.month - 1, day);
      const dayName = DAY_NAMES_DE[date.getDay()];

      const overlay = document.createElement('div');
      overlay.id = 'crew-calendar-modal-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.4);
        z-index: 999999; display: flex; align-items: center; justify-content: center;
      `;
      overlay.addEventListener('click', closeModal);

      const card = document.createElement('div');
      card.style.cssText = `
        background: #fff; border-radius: 8px; padding: 20px; min-width: 320px;
        max-width: 440px; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #333;
      `;
      card.addEventListener('click', (e) => e.stopPropagation());

      const header = document.createElement('h3');
      header.style.cssText = 'margin: 0 0 16px; font-size: 16px; font-weight: 600;';
      header.textContent = `${dayName}, ${formatDate(date)}`;

      const list = document.createElement('div');
      list.style.cssText = 'display: flex; flex-direction: column; gap: 0;';

      for (let i = 0; i < sorted.length; i++) {
        const ev = sorted[i];
        if (i > 0 && !ev.isAllDay && !sorted[i - 1].isAllDay) {
          const divider = document.createElement('div');
          divider.style.cssText = 'height: 1px; background: #eee; margin: 0;';
          list.appendChild(divider);
        }
        list.appendChild(buildEventCard(ev));
      }

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Schließen';
      closeBtn.style.cssText = `
        margin-top: 16px; padding: 8px 20px; border: none; border-radius: 4px;
        background: #f0f0f0; color: #333; cursor: pointer; font-size: 14px;
        float: right;
      `;
      closeBtn.addEventListener('click', closeModal);

      card.append(header, list, closeBtn);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      modal = overlay;
    }

    function buildEventCard(ev: CalendarEvent): HTMLElement {
      const item = document.createElement('div');

      if (ev.isAllDay) {
        item.style.cssText = `
          padding: 10px 12px; margin: 2px 0; border-radius: 6px;
          background: ${ev.color}18; border-left: 3px solid ${ev.color};
        `;
      } else {
        item.style.cssText = 'padding: 10px 0;';
      }

      const titleRow = document.createElement('div');
      titleRow.style.cssText = `font-size: 15px; font-weight: 600; margin-bottom: 4px; color: ${ev.isAllDay ? ev.color : '#333'};`;
      titleRow.textContent = ev.summary;

      const timeRow = document.createElement('div');
      timeRow.style.cssText = 'font-size: 13px; color: #555; margin-bottom: 4px;';
      if (ev.isAllDay) {
        timeRow.textContent = 'Ganztägig';
      } else {
        const s = new Date(ev.dtstart);
        const e = new Date(ev.dtend);
        timeRow.textContent = `${formatTime(s)} – ${formatTime(e)}`;
      }

      const metaRow = (icon: string, text: string, color?: string): HTMLElement => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; align-items: baseline; gap: 6px; font-size: 12px; color: #888; margin-bottom: 4px;';
        const iconEl = document.createElement('span');
        iconEl.style.cssText = 'flex-shrink: 0; width: 14px; text-align: center; font-size: 12px;';
        iconEl.textContent = icon;
        const textEl = document.createElement('span');
        if (color) textEl.style.color = color;
        textEl.textContent = text;
        row.append(iconEl, textEl);
        return row;
      };

      const calRow = document.createElement('div');
      calRow.style.cssText = 'display: flex; align-items: center; gap: 6px; font-size: 12px; color: #888; margin-bottom: 4px;';
      const dot = document.createElement('div');
      dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background: ${ev.color}; flex-shrink: 0; margin-left: 3px; margin-right: 3px;`;
      const calName = document.createElement('span');
      calName.textContent = ev.sourceName || 'Kalender';
      calRow.append(dot, calName);

      item.append(titleRow, timeRow, calRow);

      if (ev.location) {
        item.appendChild(metaRow('📍', ev.location));
      }

      if (ev.description) {
        item.appendChild(metaRow('📝', ev.description.slice(0, 300)));
      }

      return item;
    }

    function closeModal() {
      modal?.remove();
      modal = null;
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    browser.storage.onChanged.addListener((changes) => {
      if (changes['settings'] || Object.keys(changes).some((k) => k.startsWith('events_'))) {
        render(true);
      }
    });

    await render();
    watchMonthSelect(() => render());
    observeDOMChanges(() => render());
  },
});

function matchesTarget(url: string, pattern: string): boolean {
  if (!pattern) return false;

  const strip = (u: string) => u.replace(/^https?:\/\//, '');
  const normalizedUrl = strip(url);
  const normalizedPattern = strip(pattern);

  const escaped = normalizedPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  return new RegExp(escaped).test(normalizedUrl);
}

function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
