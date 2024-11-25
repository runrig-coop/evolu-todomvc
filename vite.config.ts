import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ["@evolu/common", "@evolu/common-web", "@sqlite.org/sqlite-wasm"],
  },
  worker: { format: "es" },
  server: {
    port: 37014,
  },
});
