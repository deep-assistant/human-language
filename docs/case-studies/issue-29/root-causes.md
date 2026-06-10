# Root-cause analysis

For each problem identified in `requirements.md`, we trace the symptom back to the underlying cause.

## RC1 — Demos are scattered, not enumerated in README

**Symptom (R1, R3):** the README and the published main page do not give a single clear list of demo links.

**Root cause:** the project grew organically. Demos were added file-by-file (`entities.html`, `properties.html`, `transformation/index.html`, …) but the README was always written as a "vision + features" document — it talks about demos in prose, never as a discoverable catalogue. There has never been a top-level index page either.

**Why it kept happening:** GitHub Pages with the legacy/Jekyll source uses `README.md` as the implicit landing page. Once a project ships *any* README, the landing-page question "feels solved" until somebody actually visits the site.

## RC2 — The published landing page contains `deep-assistant` URLs

**Symptom (R4):** `https://link-assistant.github.io/human-language/` renders with `<link rel="canonical" href="https://deep-assistant.github.io/human-language/" />` and visible body links to `https://github.com/deep-assistant/...`.

**Root cause is two-fold:**

1. **README content** still hard-codes `deep-assistant` URLs in the *Roadmap* and *Contributing* sections (9 occurrences). When GitHub renamed the repository from `deep-assistant/human-language` → `link-assistant/human-language`, GitHub itself transparently redirects the org URL, but the README text was never updated.
2. **Jekyll site URL inference.** The repo has no `_config.yml`. `github-pages` (and specifically the `jekyll-seo-tag` plugin) derives `site.url` from a fallback chain: `site.url` → `site.github.url` → `https://<owner>.github.io/<repo>`. On a renamed repo the value of `site.github.url` can be cached from the old repository identity, which is why we see `deep-assistant.github.io` in the canonical/og tags even though the source `<owner>` is `link-assistant`. Adding an explicit `url:` to `_config.yml` is the documented way to fix this.

## RC3 — "Republish" doesn't change anything visible

**Symptom (R5):** rebuilds happen (Pages history shows successful builds), but visiting the URL after a push doesn't show a difference. The user perceives this as "republish is broken".

**Root cause:** the published page is rendered from `README.md` without any explicit `_config.yml`, so:

- canonical / og URLs are derived from the stale `site.github.url` (RC2).
- the README has been edited many times *without* the changes that the issue is asking for — so visually the page looks the same. There is no actual CI failure (every build in `pages-builds.json` is `built` with `error.message: null`).

In other words: the build pipeline is working, but it is rebuilding the wrong content, with the wrong inferred site URL, and there is no `index.html` overriding the README. The fix is content + config, not workflow.

## RC4 — No top-level index.html

**Symptom (R3):** the published main page is just a rendered README, not a curated demo gallery.

**Root cause:** by default GitHub Pages with Jekyll prefers `index.html` (or `index.md`) over `README.md` as the landing page (Jekyll picks the first matching filename in the layout's `index` lookup; `README.md` is its fallback when nothing else is present). Adding a curated `index.html` at the repo root will both replace the auto-rendered README *as the landing page* and let us hand-write the demo gallery the issue is asking for.

## RC5 — There is no committed CI workflow file

**Symptom (operational):** `gh api .../actions/workflows` returns exactly one workflow whose `path` is `dynamic/pages/pages-build-deployment` — that is GitHub's *implicit* legacy Pages deployment, not a workflow file in the repo.

**Why it matters:** the issue says "they are published in GitHub Actions". Today, publication does happen via GitHub Actions, but only via this opaque managed workflow with no committed source. If we wanted to evolve the publish step (e.g. assemble the index from a script, add link checking), we would need a real `.github/workflows/pages.yml`. Doing so is **not** required to satisfy the immediate issue, but is mentioned in `solution-plans.md` as a follow-up.
