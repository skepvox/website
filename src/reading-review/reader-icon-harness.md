---
title: 'ReaderIcon harness (Slice C1)'
buffer: true
search: false
head:
  - ['meta', { name: 'robots', content: 'noindex' }]
---

# ReaderIcon harness

Internal **non-public** buffer page (noindexed, unlisted, out of the sitemap, local search, and LLM
output). It renders the v1 owned reader-icon set for SSR + visual tests only. `ReaderIcon` is **not**
wired into any live reader component yet — the consumer swaps are Slice C2/C3.

## Chrome size (1em ≈ 16px), decorative beside a label

<div data-testid="reader-icon-chrome" style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; font-size: 16px;">
  <span data-testid="ri-chevron-left"><ReaderIcon name="chevron-left" /> chevron-left</span>
  <span data-testid="ri-chevron-right"><ReaderIcon name="chevron-right" /> chevron-right</span>
  <span data-testid="ri-chevron-up"><ReaderIcon name="chevron-up" /> chevron-up</span>
  <span data-testid="ri-disclosure"><ReaderIcon name="disclosure" /> disclosure</span>
</div>

## Magnified (40px) — to inspect the 1.5px stroke

<div data-testid="reader-icon-magnified" style="display: flex; gap: 2.5rem; align-items: center; font-size: 40px;">
  <ReaderIcon name="chevron-left" />
  <ReaderIcon name="chevron-right" />
  <ReaderIcon name="chevron-up" />
  <ReaderIcon name="disclosure" />
</div>

## Labelled (role="img" + &lt;title&gt;)

<p data-testid="ri-labelled" style="font-size: 16px;"><ReaderIcon name="chevron-up" label="Voltar ao sumário" /> labelled instance</p>
