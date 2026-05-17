import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.travelrovr.app',
  appName: 'ROVR',
  webDir: 'dist',
  server: {
    // During development you can point this at your local Vite dev server:
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  ios: {
    // Allow the ASWebAuthenticationSession callback scheme to be handled
    scheme: 'rovr',
  },
  plugins: {
    Browser: {
      // Capacitor Browser plugin config (used as fallback on web)
    },
  },
};

export default config;