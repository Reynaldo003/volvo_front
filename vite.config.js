import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/crm_volvo/",
  server: {
    allowedHosts: ["ryrcorp.vercel.app"],
    hmr: {
      overlay: false,
    },
  },
});
