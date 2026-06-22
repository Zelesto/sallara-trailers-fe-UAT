// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            "import",
            { libraryName: "antd", libraryDirectory: "es", style: true }
          ]
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },

  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://trailers-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/variables.scss" as *;
          @use "@/theme/styles/variables-light.scss" as *;
        `
      }
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "mui-vendor": ["@mui/material", "@mui/icons-material", "@mui/x-data-grid", "@mui/x-date-pickers"],
          "chart-vendor": ["recharts"],
          "antd-vendor": ["antd"],
          "query-vendor": ["@tanstack/react-query"],
          "date-vendor": ["date-fns", "dayjs"]
        }
      }
    },
    chunkSizeWarningLimit: 2000
  },

  // Add base path for deployment
  base: '/'
});
