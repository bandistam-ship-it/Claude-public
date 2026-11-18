import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.realmcompanion',
  appName: 'Realm Companion',
  webDir: 'dist',
  // Native HTTP: Todoist calls go through Android's network stack, so the browser's CORS rules don't apply.
  plugins: { CapacitorHttp: { enabled: true } },
  android: { allowMixedContent: false },
};

export default config;
