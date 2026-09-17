# AI Template Maker

A [MOS](https://mos-official.net) plugin that uses an LLM (Anthropic, Gemini, a local Ollama
model, or any OpenAI-compatible API/server) to turn a GitHub repository's README /
Dockerfile / Compose file into a MOS app template, resolves an icon from
[selfh.st/icons](https://selfh.st/icons/) or
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
  Three tabs: Analyze (paste a repo URL, pick a template scope), History (past analyses - each
  entry shows its provider/model, links back to its repo, and can reopen its stored result in
  the install dialog without re-running the analysis), Settings (provider selection/config;
  Ollama's model field is a dropdown populated by "Test connection" against `/api/tags`, rather
  than free text, to rule out a typo'd/untagged model name by construction). The install dialog
  itself is owned by `Plugin.vue`, not the Analyze tab, precisely so History can open the same
  dialog with a stored result.
- **`staticfiles/`** — the *built* output of `page/` (committed — see Releasing below). MOS
  copies this directory verbatim to `/boot/optional/plugins/ai-template-maker/staticfiles/`
  and serves it at `/_plugins/ai-template-maker/`.
- **`bin/ai-template-maker-analyze`** — a bash script installed to `/usr/bin/plugins/` on
  the MOS host via the release `.deb` (see below). It fetches a repo's README/Dockerfile
  /compose/.env, sends them to the configured provider with the MOS template schema,
  resolves an icon, appends an entry to the history file, and prints the resulting
  template as JSON. Not called directly from the frontend (see below) — still directly
  runnable for manual testing.
- **`bin/ai-template-maker-analyze-start`** / **`-status`** / **`-cancel`** — the frontend
  actually calls `-start`, which launches the real analysis (the script above) as a detached
  background job (its own process group, via `setsid`) and returns a job id almost instantly,
  then polls `-status` every couple of seconds until it's done. This exists because analysis
  can comfortably exceed MOS's 60-second synchronous query ceiling — seen in practice on
  Ollama with a modest model/no GPU — and that ceiling isn't adjustable (MOS clamps it to 60s
  both client- and server-side, and its only other execution primitive is fire-and-forget with
  no way to return a result). The frontend gives up watching after an hour
  (`mosClient.analyzeRepo`'s `maxWaitMs`) if it's still running, but the job itself keeps going
  on the MOS host regardless - `-cancel` (wired to the Analyze tab's Cancel button) is what
  actually stops it, by killing the whole recorded process group, not just abandoning the poll
  loop. Job state self-prunes after 6 hours - deliberately well above the longest a client will
  ever wait, so a second analysis starting mid-run can't prune a still-active job's directory
  out from under it.
- **`bin/ai-template-maker-history`** — a bash script, installed alongside the above, that
  serves the history file (`list`) or resets it (`clear`) for the History tab.

### Where plugin data actually lives

MOS boots from a USB drive into RAM and only writes back to that same USB for things meant to
persist across reboots - fine for occasional config, not for a file rewritten on every single
analysis. `settings.json`'s location is fixed by MOS's own plugin settings API (written via
`POST /mos/plugins/settings/<name>`, not by this plugin directly) to
`/boot/optional/plugins/ai-template-maker/settings.json` - acceptable, since it's only written
on an explicit Settings-tab Save. `history.json` and the `jobs/` directory are this plugin's own
choice of location, though, and get written far more often - both now resolve to
`<pool-appdata>/ai-template-maker/` (the same `/boot/config/docker.json` `.appdata` setting
`remap_appdata_paths()` already resolves docker host paths against) instead, falling back to the
boot-resident path only if no pool is configured yet. `ai-template-maker-analyze`,
`-history`, `-analyze-start`, `-analyze-status`, and `-analyze-cancel` all resolve this
identically, since a job/history file written by one has to be found by the others.
- **`bin/ai-template-maker-test-ollama`** / **`-test-anthropic`** / **`-test-gemini`** /
  **`-test-openai`** — a reachability + model-availability check per provider
  (`GET <host>/api/tags`, `GET /v1/models`, `GET /v1beta/models`, `GET <base_url>/models`),
  backing each panel's "Test connection" button in Settings and populating its model field's
  dropdown. Tests whatever's currently typed in the form, not what's saved.
  `ai-template-maker-analyze`'s own `call_ollama()` does the same reachability check itself
  as a preflight before every real analysis (so an unreachable host fails fast instead of
  hanging on the deliberately timeout-free generation request below), and also resolves the
  configured model name against that same response - Ollama's `/api/chat` needs an exact tag
  match (a bare `qwen2.5-coder` only resolves if a `:latest` tag happens to exist), so using
  the configured string verbatim could pass the Settings tab's lenient test yet still get
  rejected with an opaque HTTP error at generation time. Resolving up front to the exact
  matched tag means anything that passes the test is guaranteed to also work, and a genuine
  mismatch fails immediately with a clear message (and the actual pulled-model list) instead
  of a bare curl exit code. `call_openai()` does the same model-resolution lookup, but softer:
  a mismatch there falls back to the configured name verbatim rather than failing outright,
  since "OpenAI-compatible" spans too many different servers to trust every `/models` response
  as authoritative the way Ollama's can be. That request also explicitly sets `options.num_ctx`
  (`ollama_num_ctx` in the script, default 16384) - left unset, Ollama silently falls back to a
  model's Modelfile default context window, often just 2048-4096 tokens, which is well under
  what the system prompt plus a real README/Dockerfile/compose/env can need, causing silent
  truncation of the actual repo content regardless of which model is configured.
- **`settings.json`** — default plugin settings: a `provider`
  (`anthropic`/`gemini`/`ollama`/`openai`) plus each provider's own config block (API key/model
  for Anthropic/Gemini; host/model for Ollama; a configurable `base_url` plus optional API
  key/model for OpenAI-compatible - the base URL is what lets that provider mean either the
  real OpenAI cloud API or a local server speaking the same Chat Completions format, e.g. LM
  Studio, vLLM's OpenAI server, text-generation-webui, LocalAI) and an
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

### Install-dialog safety checks

Beyond the general "use at your own risk" disclaimer, the install dialog flags two specific
things worth catching before clicking Install:

- **Port conflicts**: a proposed host port that's already bound by another container gets a
  visible warning, using the same `GET /docker/mos/ports` data as the native dialogs' "Inspect"
  panel. Docker mode checks its structured `ports` array directly; compose mode has no such
  array (ports live in raw yaml text), so it's a regex scan for the plain `"HOST:CONTAINER"`
  list-item form the analyze script's own schema always uses - it won't catch every valid
  compose ports syntax if the yaml was hand-edited into a different one (mapping form, long
  form with `target`/`published` keys), but it covers what this tool itself generates.
- **`privileged: true`**: gets a pointed red alert next to the switch, distinct from the
  general disclaimer - a template requesting full host access is meaningfully higher-risk than
  the average field, and worth a second look specifically.

### GitHub API rate limiting

Unauthenticated requests are capped at 60/hour by GitHub. `ai-template-maker-analyze`'s repo
metadata fetch distinguishes a 403/429 rate-limit response (by its `message` field) from a
genuine 404 and reports it explicitly, pointing at the optional GitHub token in Settings -
without this, a rate-limited analysis was reported as "repo not found or inaccessible", which
sent people looking for a typo instead of the actual fix.

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
