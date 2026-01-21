import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Tenshon Tiler',
        short_name: 'Tenshon',
        description: 'Professional Theater Soundboard',
        theme_color: '#0f172a', // Matches the slate-900 background
        background_color: '#0f172a',
        display: 'standalone', // Hides the browser address bar
        orientation: 'landscape', // Forces landscape mode (optional, remove if you want portrait)
        icons: [
          {
            src: 'favicon.ico', // We are using your favicon as the app icon for now
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: 'edited-image.png', // Ideally you want a 192x192 png here
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'edited-image.png', // And a 512x512 png here
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})