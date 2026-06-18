import './style.css';
import { settingsStorage, syncStateStorage } from '@/lib/storage/settings';

const statusIcon = document.getElementById('statusIcon')!;
const statusText = document.getElementById('statusText')!;
const lastSyncEl = document.getElementById('lastSync')!;
const syncNowBtn = document.getElementById('syncNow') as HTMLButtonElement;
const openOptionsBtn = document.getElementById('openOptions')!;
const enableToggle = document.getElementById('enableToggle') as HTMLInputElement;

async function render() {
  const settings = await settingsStorage.getValue();
  enableToggle.checked = settings.enabled;

  if (settings.calendarSources.length === 0) {
    statusIcon.className = 'icon unconfigured';
    statusText.textContent = 'Kein Kalender hinzugefügt';
    lastSyncEl.textContent = 'Öffne die Einstellungen, um einen Kalender hinzuzufügen.';
    syncNowBtn.disabled = true;
    return;
  }

  const state = await syncStateStorage.getValue();
  statusIcon.className = `icon ${settings.enabled ? state.status : 'unconfigured'}`;

  if (!settings.enabled) {
    statusText.textContent = 'Deaktiviert';
    lastSyncEl.textContent = '';
    syncNowBtn.disabled = true;
    return;
  }

  switch (state.status) {
    case 'idle':
      statusText.textContent = `${settings.calendarSources.length} Kalender`;
      break;
    case 'syncing':
      statusText.textContent = 'Synchronisiere...';
      break;
    case 'error':
      statusText.textContent = 'Synchronisierungsfehler';
      break;
  }

  if (state.error) {
    lastSyncEl.textContent = state.error;
  } else if (state.lastSync) {
    const d = new Date(state.lastSync);
    lastSyncEl.textContent = `Zuletzt synchronisiert: ${d.toLocaleString('de-DE')}`;
  } else {
    lastSyncEl.textContent = 'Noch nie synchronisiert';
  }

  syncNowBtn.disabled = state.status === 'syncing';
}

enableToggle.addEventListener('change', async () => {
  const settings = await settingsStorage.getValue();
  await settingsStorage.setValue({ ...settings, enabled: enableToggle.checked });
  await render();
});

syncNowBtn.addEventListener('click', async () => {
  syncNowBtn.disabled = true;
  syncNowBtn.textContent = 'Synchronisiere...';
  await browser.runtime.sendMessage({ type: 'SYNC_NOW' });
  setTimeout(async () => {
    syncNowBtn.textContent = 'Jetzt synchronisieren';
    await render();
  }, 1500);
});

openOptionsBtn.addEventListener('click', async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const windowId = tabs[0]?.windowId;
  if (windowId != null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (browser as any).sidePanel.open({ windowId });
  }
  window.close();
});

render();
