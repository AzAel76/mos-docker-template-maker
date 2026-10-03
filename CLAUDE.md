# AI Template Maker (mos-docker-template-maker)

A MOS plugin that uses an LLM (Anthropic, Gemini, Ollama or any OpenAI-compatible API) to turn a GitHub repo's
README/Dockerfile/compose into a MOS app template, then shows an install dialog before deploying. The README explains
the architecture in detail (`page/` UI, committed `staticfiles/`, `bin/` scripts installed by a `.deb`).

## How to run

- UI: `cd page && npm ci && npm run dev` (standalone, not connected to MOS); `npm run build` for the federated bundle.
- Analyzer outside MOS: `ANTHROPIC_API_KEY=… ./bin/ai-template-maker-analyze https://github.com/owner/repo [required|all]`
  (`MOS_TEMPLATE_MAKER_PROVIDER=gemini|ollama|openai` to switch provider).
- Release: README "Releasing". The built frontend **must be committed** before tagging (MOS installs from the tag's
  source tarball); pushing `vX.Y.Z` makes CI build the `.deb`.

## How to test

- No automated test suite. Before a release: `npm run build` succeeds; `bash -n bin/*` (syntax); run the analyzer
  against a known repo and compare with `samples/`; `bin/ai-template-maker-test-<provider>` checks a provider
  connection.
- Then install the release on a MOS host and run one analysis end to end (Analyze → History → Install dialog).

## Conventions

- Keep `staticfiles/` in sync with `page/` (rebuild + commit) and the version in `page/plugin.config.js` matching the tag.
- Every failure path goes through `fail()` so it lands in history; keep it that way.
- Never commit API keys; examples use placeholders.

## Where I left off

- 2026-10-03: v0.2.2 released; MIT licence added. The README's "Status: early scaffold" section is out of date
  (releases are installable) and should be rewritten.
