import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aesthetic.clone',
  appName: 'Aesthetic-Clone',
  webDir: 'dist',
  server: {
    url: 'https://grovaapp.vercel.app',
    cleartext: false
  }
};

export default config;
