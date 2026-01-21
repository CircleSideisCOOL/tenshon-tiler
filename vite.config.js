import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Include all your static assets here to ensure they are cached
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'favicon-16x16.png', 
        'favicon-32x32.png'
      ],
      manifest: {
        name: 'Tenshon Tiler',
        short_name: 'Tenshon Tiler',
        description: 'Professional Theater Soundboard',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          // Adding the small favicons here helps some browsers too
          {
            src: 'favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
