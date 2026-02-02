import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src") // Allows imports like "@/components/Button"
    }
  },
  server: {
    port: 5173,
    open: true // automatically opens the browser
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Inject global variables and themes into every SCSS file
        additionalData: `
          @use "@/variables.scss" as *;
          @use "@/theme/styles/variables-light.scss" as *;
        `
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          antd: ["antd"],
          // add other heavy libraries here if needed
        }
      }
    },
    chunkSizeWarningLimit: 1000 // optional: raise warning threshold
  }
});
