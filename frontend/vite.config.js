import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // по умолчанию vite слушает только ::1, и 127.0.0.1:5173 не открывается
    host: '127.0.0.1',
    // запросы /api уходят на fastapi
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
