---
title: 'Pipeline reader prototype — Introdução à ontologia'
buffer: true
search: false
head:
  - ['meta', { name: 'robots', content: 'noindex' }]
---

# Pipeline reader prototype — *Introdução à ontologia*

Internal, **non-public** full-work reader prototype (a buffer page: noindexed, unlisted, out of the
sitemap, local search, and LLM output). It proves the mature reader shape for the **whole work** without
loading all prose: the *Trechos* zoom-out is built from `pipeline-export-segments.json` — **metadata
only**, all 99 `pt` segments grouped by authored Part → Chapter → Segment — while prose is loaded **only**
for the small preview window (`pipeline-preview-window.json`). Unloaded segments appear as metadata-only
rows marked *não carregado*; selecting one loads/imports nothing. It creates **no** public segment route;
the live work at `/louis-lavelle/introduction-a-l-ontologie` (12 fr chapter pages) was the legacy fr edition, removed in slice A5; this QA surface previews the committed pipeline-export data only.

<PipelineReaderPreview />
