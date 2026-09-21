# Local AI Daily Briefing

A locally generated daily briefing that combines development activity, weather, general news and AI news into a concise morning report and delivers it by email.

The project is built with Node.js and TypeScript and uses local LLM inference through Ollama. Most of the data collection and preprocessing is deterministic; the language model is used primarily for selection, synthesis and summarization.

## Overview

The goal of this project is to turn several small, repetitive information-gathering tasks into one useful daily briefing.

It currently combines:

- recent Git activity from a configurable local repository
- activity on unmerged remote branches
- current weather and daily forecast
- general news
- dedicated AI and developer-related news
- estimated reading times for AI articles
- local LLM-based summarization
- email delivery through Microsoft Graph

The result is a short briefing designed to answer:

- What changed in the project?
- Is there active work on unmerged branches?
- What does the day look like weather-wise?
- What important general news should I know about?
- What happened in AI and developer tooling?

## Example

```text
## Next.js Project

### Main branch
Repository: nextjs
Branch: main
Working-tree state: Clean
Activity window: last 7 days.
Latest commit: 25 Aug 2026, 13:06.

Recent work:
- Breadcrumb improvements across several page components and supporting models.
- Author and gallery metadata updates.
- Event portal cleanup and optimization.

### Active unmerged branches
Activity window: last 30 days.

- next-styles — 13 commits ahead of main.
  Recent work includes responsive article changes, tablet breakpoints,
  header/footer styling and font-related updates.

## Weather in Bremen
Current conditions: ...

## General News
- [Article](...) — concise summary

## AI News
- [Article](...) (10 min read) — concise summary
