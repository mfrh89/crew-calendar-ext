import './style.css';
import { syncStateStorage } from '@/lib/storage/settings';
import { hasCredentials } from '@/lib/storage/credentials';

const statusIcon = document.getElementById('statusIcon')!;
const statusText = document.getElementById('statusText')!;
const lastSyncEl = document.getElementById('lastSync')!;
const syncNowBtn = document.getElementById('syncNow') as HTMLButtonElement;
const openOptionsBtn = document.getElementById('openOptions')!;

async function render() {
  const configured = await hasCredentials();

  if (!configured) {
    statusIcon.className = 'icon unconfigured';
    statusText.textContent = 'Not configured';
    lastSyncEl.textContent = 'Open settings to connect your calendar.';
    syncNowBtn.disabled = true;
    return;
  }

  const state = await syncStateStorage.getValue();

  statusIcon.className = `icon ${state.status}`;

  switch (state.status) {
    case 'idle':
      statusText.textContent = 'Connected';
      break;
    case 'syncing':
      statusText.textContent = 'Syncing...';
      break;
    case 'error':
      statusText.textContent = 'Sync error';
      break;
  }

  if (state.lastSync) {
    const d = new Date(state.lastSync);
    lastSyncEl.textContent = `Last sync: ${d.toLocaleString('de-DE')}`;
  } else if (state.error) {
    lastSyncEl.textContent = state.error;
  } else {
    lastSyncEl.textContent = 'Never synced';
  }

  syncNowBtn.disabled = state.status === 'syncing';
}

syncNowBtn.addEventListener('click', async () => {
  syncNowBtn.disabled = true;
  syncNowBtn.textContent = 'Syncing...';
  await browser.runtime.sendMessage({ type: 'SYNC_NOW' });
  setTimeout(async () => {
    syncNowBtn.textContent = 'Sync Now';
    await render();
  }, 1500);
});

openOptionsBtn.addEventListener('click', () => {
  browser.runtime.openOptionsPage();
});

render();
