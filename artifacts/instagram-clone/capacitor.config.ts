import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aesthetic.clone',
  appName: 'Aesthetic-Clone',
  webDir: 'dist',
  server: {
    url: 'https://grova-proxy.mehaboobmustaq0.workers.dev',
    cleartext: false
  }
};

export default config;
