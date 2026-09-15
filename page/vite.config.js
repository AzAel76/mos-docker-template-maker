import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import federation from "@originjs/vite-plugin-federation";

// Built as a federated remote so the MOS host frontend can load Plugin.vue
// at runtime. `npm run dev` still works standalone for local development
// (see src/main.js), independent of federation.
export default defineConfig({
  // Relative base so remoteEntry.js's CSS/asset loader resolves paths
  // against wherever it was actually fetched from (/_plugins/<name>/...)
  // instead of the site root.
  base: "",
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
    cssCodeSplit: false,
    // MOS's frontend fetches the remote at /_plugins/<name>/remoteEntry.js
    // (served from this build's output root) - keep everything flat instead
    // of nested under assets/.
    assetsDir: ""
  }
});
