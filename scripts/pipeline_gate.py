#!/usr/bin/env python3
"""Stability-aware publication gate for pipeline-export routes (Slice 2K; B3 prefix-only publication).

Single source of truth for deriving a segment's PUBLIC visibility from its pipeline metadata, per the
export contract (book-pipeline docs/website-export-contract.md §5): `urlStability == "stable"` is the
ONLY state the website may index / canonicalize / sitemap / search / feed to LLMs. Everything else
(draft, provisional) stays hidden: buffer + noindex, out of sitemap / search / LLM.

`stable` is the pipeline's single, EXPLICIT publish signal, set only at a deliberate publish act, under
EITHER publication model: a **slug-tail** work freezes a `publicSlug`; a **prefix-only** work (e.g. Brás
Cubas) needs NO publicSlug — its bare `segmentPrefix` is the permanent public leaf, so it is `stable` once
publishable. The gate therefore keys on `urlStability` alone (B3): requiring a publicSlug too would wrongly
hide prefix-only public books. This stays safe — Lavelle fr (draft source edition), reading-review buffers,
and any unpublished/draft work are never `stable`, so they remain hidden.

This module DECIDES visibility from existing metadata. It NEVER mints publicSlug and NEVER changes
urlStability — making a route public is a pipeline-side publication act, surfaced here only as a flag.
The page generator consumes route_visibility() to choose each page's frontmatter.
"""

from __future__ import annotations


def route_visibility(segment: dict) -> dict:
    """Return the public-visibility decision for one segment metadata record.

    eligible (public) iff urlStability == "stable" — the pipeline's explicit publish signal, set under
    either publication model (slug-tail freezes a publicSlug; prefix-only needs none — its segmentPrefix
    is the permanent public leaf). publicSlug is retained for information only. Anything else is hidden.
    """
    url_stability = segment.get("urlStability")
    public_slug = segment.get("publicSlug")
    has_public_slug = bool(public_slug)
    eligible = url_stability == "stable"
    return {
        "urlStability": url_stability,
        "hasPublicSlug": has_public_slug,
        "eligible": eligible,
        # presentation gates the page generator applies to frontmatter:
        "buffer": not eligible,
        "noindex": not eligible,
        # public-surface intent (consumed at relocation time):
        "search": eligible,
        "sitemap": eligible,
        "index": eligible,
        "canonical": eligible,
        "llm": eligible,
    }


def main() -> None:
    import json
    import sys

    raw = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read()
    print(json.dumps(route_visibility(json.loads(raw))))


if __name__ == "__main__":
    main()
