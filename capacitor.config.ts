import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.foodex.app',
  appName: 'Foodex',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
