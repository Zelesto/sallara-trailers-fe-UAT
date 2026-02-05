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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          antd: ["antd"]
        }
      }
    },
    chunkSizeWarningLimit: 2000
  }
});
