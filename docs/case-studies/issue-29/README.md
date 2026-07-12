# Case Study: Issue #29

> Source: [link-assistant/human-language#29](https://github.com/link-assistant/human-language/issues/29)
>
> Title: *Make sure all our demos are listed in README, they are published in GitHub Actions and we have direct links to all demos from https://link-assistant.github.io/human-language main page*

## Contents

- `issue-29.json` — full issue payload (body, labels, comments) at the time of analysis.
- `pages-config.json` — GitHub Pages configuration for the repository.
- `pages-builds.json` — full history of GitHub Pages builds.
- `workflow-runs.json` — list of GitHub Actions workflow runs (only `pages-build-deployment` exists).
- `repo-info.json` — repository metadata (homepage, default branch, description).
- `live-page-snapshot.html` — snapshot of `https://link-assistant.github.io/human-language/` taken during analysis.
- `timeline.md` — reconstructed timeline / sequence of events.
- `requirements.md` — explicit list of every requirement extracted from the issue.
- `root-causes.md` — root-cause analysis for each problem.
- `solution-plans.md` — proposed solutions, alternatives, and known components/libraries that can help.
- `external-research.md` — external facts, references and prior art.

## Quick summary

Issue #29 bundles four related goals around the project's public face on GitHub Pages:

1. **Discoverability** — every demo must be listed in `README.md`.
2. **Publication** — every demo must actually be reachable through GitHub Actions / Pages.
3. **Direct links** — the main page (`https://link-assistant.github.io/human-language/`) must link directly to every demo.
4. **Hygiene** — clean up any leftover references to the previous organization name (`deep-assistant`) and fix anything that prevents the site from being republished correctly.

The case study reconstructs how the project arrived at this state, identifies the underlying root causes and proposes a single coherent fix that addresses all four goals together.
