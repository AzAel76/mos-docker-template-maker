# AI Template Maker

A [MOS](https://mos-official.net) plugin that uses an LLM (Anthropic, Gemini, or a local
Ollama model) to turn a GitHub repository's README / Dockerfile / Compose file into a
MOS app template, resolves an icon from [selfh.st/icons](https://selfh.st/icons/) or
[dashboard-icons](https://github.com/homarr-labs/dashboard-icons), and shows a MOS
Hub-style install dialog before deploying.

> **⚠️ Use at your own risk.** The generated template is a best-effort guess from an
> LLM reading the repository's docs — it can misread a port, invent a path that isn't
> actually right, mask a variable that isn't secret, or miss one the app requires. It
> is not a substitute for reading the project's own documentation. Always review every
> field in the install dialog, and check the project's docs, before clicking Install —
> especially for anything exposing ports, mounting host paths, or running privileged.

## How it works

- **`page/`** — the plugin's Vue 3 + Vuetify 4 UI source, built with `vite-plugin-federation`
  so MOS's frontend can load it as a micro-frontend at `/_plugins/ai-template-maker/remoteEntry.js`.
  Three tabs: Analyze (paste a repo URL, pick a template scope), History (past analyses,
  each linking back to its repo), Settings (provider selection/config).
- **`staticfiles/`** — the *built* output of `page/` (committed — see Releasing below). MOS
  copies this directory verbatim to `/boot/optional/plugins/ai-template-maker/staticfiles/`
  and serves it at `/_plugins/ai-template-maker/`.
- **`bin/ai-template-maker-analyze`** — a bash script installed to `/usr/bin/plugins/` on
  the MOS host via the release `.deb` (see below). It fetches a repo's README/Dockerfile
  /compose/.env, sends them to the configured provider with the MOS template schema,
  resolves an icon, appends an entry to the history file, and prints the resulting
  template as JSON. Not called directly from the frontend (see below) — still directly
  runnable for manual testing.
- **`bin/ai-template-maker-analyze-start`** / **`bin/ai-template-maker-analyze-status`** —
  the frontend actually calls `-start`, which launches the real analysis (the script above)
  as a detached background job and returns a job id almost instantly, then polls `-status`
  every couple of seconds until it's done. This exists because analysis can comfortably
  exceed MOS's 60-second synchronous query ceiling — seen in practice on Ollama with a
  modest model/no GPU — and that ceiling isn't adjustable (MOS clamps it to 60s both
  client- and server-side, and its only other execution primitive is fire-and-forget with
  no way to return a result). Job state lives under
  `/boot/optional/plugins/ai-template-maker/jobs/<job-id>/` and self-prunes after an hour.
- **`bin/ai-template-maker-history`** — a bash script, installed alongside the above, that
  serves the history file (`list`) or resets it (`clear`) for the History tab.
- **`settings.json`** — default plugin settings: a `provider` (`anthropic`/`gemini`/`ollama`)
  plus each provider's own config block (API key/model, or host/model for Ollama) and an
  optional GitHub token. Editable from the plugin's Settings tab and stored at
  `/boot/optional/plugins/ai-template-maker/settings.json`.

### Host paths and the appdata directory

Generated host paths never hardcode a guessed pool/directory name, because MOS resolves
them two different ways depending on template mode:

- **compose mode**: every volume's host side is a relative `./<service-name>/<subpath>`
  path. MOS runs each stack from a working directory already inside the real configured
  appdata location (`dockercompose.service.js`'s `_getWorkingPath`), so a relative path
  always lands in the right place with no extra work.
- **docker mode**: the model invents the placeholder `/mnt/cache/appdata/<app>/<name>`
  (matching MOS's own Hub template convention), and `ai-template-maker-analyze` rewrites
  it to the box's real configured path by reading `/boot/config/docker.json`'s `.appdata`
  field directly — the same file `mos-deploy_docker` itself reads. This has to happen in
  our script rather than relying on MOS: `mos-deploy_docker` only does this rewrite when
  invoked with an explicit `override_appdata` argument, which the plain REST create call
  this plugin uses never passes.

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
ANTHROPIC_API_KEY=sk-ant-... ./bin/ai-template-maker-analyze https://github.com/owner/repo [required|all]
```

The optional second argument controls template scope: `required` (default) includes only
what's needed to run; `all` includes every setting found in the repo's docs. Set
`MOS_TEMPLATE_MAKER_PROVIDER=gemini` or `ollama` (with `GEMINI_API_KEY`/`OLLAMA_HOST` as
needed) to test a different provider standalone.

## Status

Early scaffold — see `samples/` for real MOS template examples used as the schema
reference, and the project plan for what's left before this is installable on a real
MOS box.
