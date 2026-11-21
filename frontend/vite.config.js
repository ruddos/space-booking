import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // слушаем и 127.0.0.1, и ::1 — иначе localhost в разных браузерах то открывается, то нет
    host: true,
    // запросы /api уходят на fastapi
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
