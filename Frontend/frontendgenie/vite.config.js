import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import envCompatible from 'vite-plugin-env-compatible'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    envCompatible()  // Ensures compatibility with existing .env variables
  ],
  define: {
    // Make sure the environment variables are loaded properly
    'process.env': process.env
  }
})
