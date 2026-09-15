import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";

// Built as a federated remote so the MOS host frontend can load Plugin.vue
// at runtime. `npm run dev` still works standalone for local development
// (see src/main.js), independent of federation.
export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: "ai-template-maker",
      filename: "remoteEntry.js",
      exposes: {
        "./Plugin": "./src/Plugin.vue"
      },
      shared: ["vue", "vuetify"]
    })
  ],
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false
  }
});
