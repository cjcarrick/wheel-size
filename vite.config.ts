import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],

  base: '/wheel-size/',

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/assets/globals.scss";`
      }
    }
  }
})
