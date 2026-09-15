# AI Template Maker

A [MOS](https://mos-official.net) plugin that uses Claude to turn a GitHub repository's
README / Dockerfile / Compose file into a MOS app template, resolves an icon from
[selfh.st/icons](https://selfh.st/icons/) or [dashboard-icons](https://github.com/homarr-labs/dashboard-icons),
and shows a MOS Hub-style install dialog before deploying.

## How it works

- **`page/`** — the plugin's Vue 3 + Vuetify 4 UI, built with `vite-plugin-federation` so
  MOS's frontend can load it as a micro-frontend.
- **`bin/ai-template-maker-analyze`** — a bash script installed to `/usr/bin/plugins/` on
  the MOS host. It fetches a repo's README/Dockerfile/compose file, sends them to Claude
  with the MOS template schema, resolves an icon, and prints the resulting template as
  JSON. Invoked synchronously via `POST /mos/plugins/query`.
- **`functions`** — install/uninstall hooks that place the analyze script on the host.
- **`settings.json`** — default plugin settings (Anthropic API key, model, optional GitHub
  token), editable from the plugin's Settings tab and stored at
  `/boot/optional/plugins/ai-template-maker/settings.json`.

## Local development

```bash
cd page
npm install
npm run dev      # standalone dev server, not connected to a real MOS host
npm run build    # produces the federated remoteEntry.js + Plugin chunk
```

To exercise the analyze script outside of MOS:

```bash
ANTHROPIC_API_KEY=sk-ant-... ./bin/ai-template-maker-analyze https://github.com/owner/repo
```

## Status

Early scaffold — see `samples/` for real MOS template examples used as the schema
reference, and the project plan for what's left before this is installable on a real
MOS box.
