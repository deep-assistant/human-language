# Solution plans

For each root cause we list the chosen approach, the alternatives considered, and any existing components / libraries that solve the same class of problem.

## SP1 — Add a curated `index.html` (addresses RC1, RC3, RC4 → R1, R3, R5)

**Chosen approach.** Commit a hand-written `index.html` at the repository root that:

- Renders a hero / introduction matching the README's vision.
- Lists every demo with a heading, a one-line description, and a direct link.
- Uses only static HTML + minimal CSS (no build step) — consistent with how the rest of the project is shipped.
- Includes a `<base>` / relative links that work both at `https://link-assistant.github.io/human-language/` and when opened locally as `file://`.

**Why this works.** GitHub Pages' Jekyll layer prefers `index.html` over `README.md` as the landing page, so committing it instantly replaces the auto-generated README rendering with our curated gallery. No workflow change is required.

**Alternatives considered:**

- *Edit the README to include demo links and rely on Jekyll's README rendering.* — Cleaner from a single-source-of-truth perspective, but the rendered result still goes through Jekyll's default theme (Cayman) which adds a sidebar, a banner with the repo name, and SEO tags. We can't curate visual layout. We do this *in addition to* `index.html` so the README is also useful inside GitHub.
- *Generate `index.html` from README via a Jekyll layout / a custom `_config.yml` permalink.* — More moving parts, no real benefit over a static page for a project of this size.
- *Use a static-site generator (Astro, Eleventy, Docusaurus).* — Heavyweight; the project explicitly avoids a build step ("**No build step required**" — README §Architecture).

**Reusable components considered:**

- [`jekyll-theme-cayman`](https://github.com/pages-themes/cayman) — already implicitly used; we keep it as the README fallback theme, but override the landing page with our `index.html`.
- [`Pico.css`](https://picocss.com/) / [`new.css`](https://newcss.net/) — minimal classless stylesheets we could include via CDN. We won't, because the page is small enough to inline its own CSS.

## SP2 — Add a `_config.yml` to fix the inferred site URL (addresses RC2 → R4, R5)

**Chosen approach.** Add a minimal `_config.yml` at the repo root:

```yaml
title: Human Language Project
description: A new kind of language for all people on earth
url: https://link-assistant.github.io
baseurl: /human-language
theme: jekyll-theme-cayman
plugins:
  - jekyll-seo-tag
```

**Why this works.** `jekyll-seo-tag` reads `site.url` and `site.baseurl` directly when present, short-circuiting the stale inference. The published canonical / og URLs become `https://link-assistant.github.io/human-language/`.

**Alternatives:**

- *Disable `jekyll-seo-tag` entirely.* — Loses SEO benefits; doesn't fix the body link to `deep-assistant`.
- *Disable Jekyll altogether by adding a `.nojekyll` file.* — Would also work as an escape hatch (and we'd serve our `index.html` raw), but it would stop Markdown rendering of all the other docs in the repo. Not worth the regression.

## SP3 — Update `README.md` text to drop `deep-assistant` URLs and add a Demos section (addresses R1, R4)

**Chosen approach.** Replace the 9 `https://github.com/deep-assistant/...` occurrences with `https://github.com/link-assistant/...`. Add a *🎬 Demos* section near the top of the README that links every demo via its GitHub Pages URL. The README serves both GitHub repo viewers and the published site.

**Why this works.** Even though `index.html` is now the landing page, GitHub renders `README.md` on the repository home — keeping it accurate matters too.

**Alternatives:**

- *sed / scripted rewrite.* — Same outcome, but the replacements are few enough to do as deliberate edits.

## SP4 — Touch a deployment marker so the next push triggers a fresh build (addresses R5)

**Chosen approach.** No special trigger needed: any change to a tracked file on `main` triggers `pages-build-deployment` automatically. Merging this PR provides that change.

**Alternatives:**

- *Add an explicit `.github/workflows/pages.yml` using `actions/deploy-pages@v4`.* — Documented as a follow-up in `external-research.md`; not done in this PR to keep the change focused.

## SP5 — (Follow-up, not in this PR) Replace implicit Pages workflow with a committed one

A future PR can introduce `.github/workflows/pages.yml` using the official actions:

```yaml
name: Deploy GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/jekyll-build-pages@v1
      - uses: actions/upload-pages-artifact@v3
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Benefit:** the publish step lives in the repo, can be linted and audited, and supports `workflow_dispatch` re-runs. **Cost:** small ongoing maintenance and a switchover from "legacy" to "GitHub Actions" pages mode. Out of scope for #29.
