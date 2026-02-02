import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react({
      // Optional: configure Babel for on-demand imports (e.g., Ant Design)
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
      "@": path.resolve(__dirname, "src") // Enables "@/..." imports
    }
  },

  server: {
    port: 5173,
    open: true // Auto-open browser on dev start
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
          antd: ["antd"],
          // Add other heavy libraries here if needed
        }
      }
    },
    chunkSizeWarningLimit: 2000 // Raise threshold to reduce warnings
  }
});
