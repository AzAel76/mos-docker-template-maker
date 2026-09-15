# AI Template Maker

A [MOS](https://mos-official.net) plugin that uses Claude to turn a GitHub repository's
README / Dockerfile / Compose file into a MOS app template, resolves an icon from
[selfh.st/icons](https://selfh.st/icons/) or [dashboard-icons](https://github.com/homarr-labs/dashboard-icons),
and shows a MOS Hub-style install dialog before deploying.

## How it works

- **`page/`** — the plugin's Vue 3 + Vuetify 4 UI source, built with `vite-plugin-federation`
  so MOS's frontend can load it as a micro-frontend at `/_plugins/ai-template-maker/remoteEntry.js`.
- **`staticfiles/`** — the *built* output of `page/` (committed — see Releasing below). MOS
  copies this directory verbatim to `/boot/optional/plugins/ai-template-maker/staticfiles/`
  and serves it at `/_plugins/ai-template-maker/`.
- **`bin/ai-template-maker-analyze`** — a bash script installed to `/usr/bin/plugins/` on
  the MOS host via the release `.deb` (see below). It fetches a repo's README/Dockerfile
  /compose/.env, sends them to Claude with the MOS template schema, resolves an icon, and
  prints the resulting template as JSON. Invoked synchronously via `POST /mos/plugins/query`.
- **`settings.json`** — default plugin settings (Anthropic API key, model, optional GitHub
  token), editable from the plugin's Settings tab and stored at
  `/boot/optional/plugins/ai-template-maker/settings.json`.

## Releasing

MOS installs a plugin from a GitHub Release in two parts: a single `.deb` asset matching
the host architecture (`dpkg -i`'d directly — this is what actually places
`bin/ai-template-maker-analyze` at `/usr/bin/plugins/`), and the release tag's
auto-generated source tarball, from which it copies `settings.json`, `staticfiles/`, and
`page/plugin.config.js` into place. Because that's the raw git tree at the tag (not a CI
build artifact), **the built frontend has to be committed before tagging**:

```bash
cd page && npm ci && npm run build
rm -rf ../staticfiles && cp -r dist/. ../staticfiles/
cd ..
# bump version in page/plugin.config.js to match the new tag
git add staticfiles page/plugin.config.js
git commit -m "Release vX.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```

Pushing the tag triggers `.github/workflows/release.yml`, which builds `ai-template-maker_X.Y.Z_all.deb`
from `bin/` and attaches it (+ an `.md5`) to the release.

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
