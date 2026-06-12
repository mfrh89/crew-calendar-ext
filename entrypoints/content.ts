import { detectDayBar, type DayBarInfo } from '@/lib/dom/detector';
import { injectStrip, removeStrip } from '@/lib/dom/injector';
import { observeDOMChanges } from '@/lib/dom/observer';
import { loadEvents } from '@/lib/storage/events';
import { settingsStorage } from '@/lib/storage/settings';
import type { CalendarEvent, Settings } from '@/lib/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  async main() {
    const settings = await settingsStorage.getValue();
    if (!settings.targetUrl || !matchesTarget(window.location.href, settings.targetUrl)) {
      return;
    }

    let currentDayBar: DayBarInfo | null = null;
    let modal: HTMLElement | null = null;

    async function render() {
      const dayBar = detectDayBar(settings.customSelector);
      if (!dayBar) {
        removeStrip();
        currentDayBar = null;
        return;
      }

      currentDayBar = dayBar;
      const events = await loadEvents(dayBar.year, dayBar.month);
      injectStrip(dayBar, events, settings.stripPosition, showEventModal);
    }

    function showEventModal(event: CalendarEvent) {
      closeModal();

      const overlay = document.createElement('div');
      overlay.id = 'crew-calendar-modal-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.4);
        z-index: 999999; display: flex; align-items: center; justify-content: center;
      `;
      overlay.addEventListener('click', closeModal);

      const card = document.createElement('div');
      card.style.cssText = `
        background: #fff; border-radius: 8px; padding: 20px; min-width: 300px;
        max-width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #333;
      `;
      card.addEventListener('click', (e) => e.stopPropagation());

      const colorBar = document.createElement('div');
      colorBar.style.cssText = `
        height: 4px; border-radius: 4px 4px 0 0; margin: -20px -20px 16px;
        background: ${event.calendarColor};
      `;

      const title = document.createElement('h3');
      title.style.cssText = 'margin: 0 0 12px; font-size: 18px; font-weight: 600;';
      title.textContent = event.summary;

      const details = document.createElement('div');
      details.style.cssText = 'font-size: 14px; line-height: 1.6;';

      const startDate = new Date(event.dtstart);
      const endDate = new Date(event.dtend);

      if (event.isAllDay) {
        details.appendChild(detailRow('Date', formatDate(startDate)));
      } else {
        details.appendChild(detailRow('Date', formatDate(startDate)));
        details.appendChild(detailRow('Time', `${formatTime(startDate)} - ${formatTime(endDate)}`));
      }

      if (event.location) {
        details.appendChild(detailRow('Location', event.location));
      }

      if (event.description) {
        const desc = document.createElement('p');
        desc.style.cssText = 'margin: 12px 0 0; color: #666; font-size: 13px; white-space: pre-wrap;';
        desc.textContent = event.description.slice(0, 500);
        details.appendChild(desc);
      }

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = `
        margin-top: 16px; padding: 8px 20px; border: none; border-radius: 4px;
        background: #f0f0f0; color: #333; cursor: pointer; font-size: 14px;
        float: right;
      `;
      closeBtn.addEventListener('click', closeModal);

      card.append(colorBar, title, details, closeBtn);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      modal = overlay;
    }

    function closeModal() {
      modal?.remove();
      modal = null;
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    browser.storage.onChanged.addListener((changes) => {
      if (!currentDayBar) return;
      const key = `events_${currentDayBar.year}-${String(currentDayBar.month).padStart(2, '0')}`;
      if (changes[key]) render();
    });

    await render();
    observeDOMChanges(() => render());
  },
});

function matchesTarget(url: string, pattern: string): boolean {
  try {
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(url);
  } catch {
    return url.startsWith(pattern.replace(/\*/g, ''));
  }
}

function detailRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  row.style.cssText = 'display: flex; gap: 8px;';

  const lbl = document.createElement('span');
  lbl.style.cssText = 'color: #888; min-width: 70px;';
  lbl.textContent = label;

  const val = document.createElement('span');
  val.textContent = value;

  row.append(lbl, val);
  return row;
}

function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
