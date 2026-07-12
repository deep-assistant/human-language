# External research

Sources consulted while preparing this case study.

## GitHub Pages — landing-page resolution

- *About GitHub Pages and Jekyll* — when both `index.html` and `README.md` are present at the publishing source, GitHub Pages serves `index.html` as the landing page; otherwise it falls back to `README.md` rendered with the configured Jekyll theme. <https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll>
- *Configuring a publishing source for your GitHub Pages site* — confirms that the legacy "branch + folder" mode we currently use rebuilds on every push to that branch. <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>

## Jekyll site URL inference / `jekyll-seo-tag`

- `jekyll-seo-tag` README, *"site.url"* section — explicitly recommends setting `url` (and `baseurl`) in `_config.yml` so canonical/`og:url` tags are correct, and notes that on GitHub Pages the value is otherwise derived from `site.github.url`, which can be stale on renamed repos. <https://github.com/jekyll/jekyll-seo-tag/blob/master/docs/usage.md>
- `github-metadata` plugin — populates `site.github` from the GitHub API; documents the same caveat. <https://github.com/jekyll/github-metadata>

## Repository renames and redirects

- *About repository transfers / renames* — GitHub keeps HTTP redirects for the old URL, but **only at the GitHub.com level**. Jekyll-rendered `<link rel="canonical">` and absolute URLs embedded in markdown are *not* automatically rewritten. <https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository>
- *Renaming an organization* — same story for organization renames; redirects exist at the platform level, not in your content. <https://docs.github.com/en/organizations/managing-organization-settings/renaming-your-organization>

## Comparable projects ("project landing page on Pages")

Looked at how other small "demo gallery" projects on GitHub Pages structure their landing page:

- [pages-themes/cayman](https://github.com/pages-themes/cayman) — the default theme our site uses. Demonstrates the default README-as-landing-page rendering we are replacing.
- [danmarshall/demo-gallery](https://github.com/danmarshall/demo-gallery) — a hand-written `index.html` that lists demos with thumbnails. Confirms that a static curated gallery is the conventional approach for a project this size.
- [microsoft/vscode-extension-samples](https://github.com/microsoft/vscode-extension-samples) — README is a curated table of samples, each linking to its subfolder. The approach we adopt for the `🎬 Demos` section in our README is the same shape.

## Conclusion of research

No third-party project bug to file. The behaviour is documented and configurable; the fix is local content + `_config.yml`. The follow-up workflow file (SP5) would use only first-party `actions/*` actions whose docs are linked from `solution-plans.md`.
