import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aesthetic.clone',
  appName: 'Grovaa',
  webDir: 'dist',
  server: {
    url: 'https://grova-proxy.mehaboobmustaq0.workers.dev',
    cleartext: false
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
