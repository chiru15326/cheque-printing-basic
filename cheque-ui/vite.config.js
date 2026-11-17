import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // lets phones on the same Wi-Fi open the dev server too
    proxy: {
      // During development, React (5173) forwards /api calls to the .NET API (5000)
      "/api": "http://localhost:5000"
    }
  },
  build: {
    // "npm run build" puts the finished React app straight into the API's wwwroot
    outDir: "../ChequeApi/wwwroot",
    emptyOutDir: true
  }
});
