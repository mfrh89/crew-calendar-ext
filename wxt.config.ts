import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Crew Calendar',
    description: 'Private calendar overlay for airline crew scheduling tools',
    permissions: ['storage', 'alarms'],
    optional_host_permissions: ['<all_urls>'],
    options_ui: {
      open_in_tab: true,
    },
  },
});
