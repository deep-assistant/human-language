# Requirements extracted from issue #31

The body of the issue is short but it bundles four distinct asks. Each of them is treated as a separate requirement here.

## R1 — Click every link on the landing page and confirm it works

> "We need to click all links in our landing page, and make sure it is working"

The landing page (`index.html` at the site root) has, at the time of writing:

- 8 demo cards (`transformation/index.html`, `transformation/test-ngram.html`, `entities.html`, `properties.html`, `search-demo.html`, `cache-demo.html`, `browser-cache-test.html`, `run-tests.html`).
- 6 documentation links to `github.com/link-assistant/human-language` (README, SEARCH_README, transformation README, ngram-feature-summary, research/, docs/case-studies/).
- 2 header buttons ("View on GitHub", "Read the README").
- 3 footer links (repo, issues, license).

R1 is satisfied when every demo card opens a fully-functional demo and every doc link resolves on GitHub.

## R2 — Fix the explicitly named broken pages

> "For example these are totally broken and needs fixing:
> https://link-assistant.github.io/human-language/entities.html
> https://link-assistant.github.io/human-language/properties.html"

Both pages must render their first-run state (Q35120 / P31) without console errors.

## R3 — Check for errors and bugs in **all** demos and fix as much as possible

> "Also check for errors and bug all our demos, and fix as much bugs in codebase as possible, so everything will be reliable."

Treat each demo as a candidate for the same class of bug; the audit cannot stop at the two pages explicitly named.

## R4 — Compile a case study under `docs/case-studies/issue-{id}`

> "We need to download all logs and data related about the issue to this repository, make sure we compile that data to ./docs/case-studies/issue-{id} folder, and use it to do deep case study analysis (also make sure to search online for additional facts and data), in which we will reconstruct timeline/sequence of events, list of each and all requirements from the issue, find root causes of the each problem, and propose possible solutions and solution plans for each requirement (we should also check known existing components/libraries, that solve similar problem or can help in solutions)."

The case study artefacts live next to the existing `docs/case-studies/issue-29/` folder and follow the same structure: timeline, requirements, root causes, solution plans, external research, raw data dumps.

## R5 — Add debug output / verbose mode if root cause cannot otherwise be reached

> "If there is not enough data to find actual root cause, add debug output and verbose mode if not present, that will allow us to find root cause on next iteration."

For #31 the root cause is reproducible from the existing devtools screenshot alone (four 404s and a `TypeError`), so additional logging is not required this iteration. The case study still records exactly which network requests must succeed for the page to mount, so future regressions of the same family can be diagnosed by inspecting Network tab alone.

## R6 — File upstream issues with reproducible examples for related projects

> "If issue related to any other repository/project, where we can report issues on GitHub, please do so. Each issue must contain reproducible examples, workarounds and suggestions for fix the issue in code."

The bug is local to this repository — the `_config.yml` `exclude:` glob is interpreted exactly as documented by Jekyll (see `external-research.md`), and there is no upstream defect. R6 therefore has no upstream report to file. The case study still documents the surprising-but-correct Jekyll behaviour so future contributors do not re-trip on it.
