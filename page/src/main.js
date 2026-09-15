// Standalone dev entry point (npm run dev). Not used when the host MOS
// frontend loads Plugin.vue via module federation — that path only ever
// imports src/Plugin.vue directly (see vite.config.js `exposes`).
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import "vuetify/styles";
import Plugin from "./Plugin.vue";

const vuetify = createVuetify();

createApp(Plugin).use(vuetify).mount("#app");
