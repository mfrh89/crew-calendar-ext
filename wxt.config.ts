import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Crew Calendar',
    description: 'Private calendar overlay for airline crew scheduling tools',
    permissions: ['storage', 'alarms', 'tabs', 'sidePanel'],
    host_permissions: ['https://ferien-api.de/*'],
    optional_host_permissions: ['<all_urls>'],
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      (manifest as Record<string, unknown>)['side_panel'] = { default_path: 'options.html' };
    },
  },
});
