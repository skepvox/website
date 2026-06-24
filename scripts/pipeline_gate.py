#!/usr/bin/env python3
"""Stability-aware publication gate for pipeline-export routes (Slice 2K).

Single source of truth for deriving a segment's PUBLIC visibility from its pipeline metadata, per the
export contract (see docs/introduction-a-ontologia-live-migration-plan.md §3b/§3e and the pipeline
public-url-convention): urlStability == "stable" — which the pipeline only ever sets together with a
frozen publicSlug — is the ONLY state the website may index / canonicalize / sitemap / search / feed to
LLMs. Everything else (draft, provisional, or any segment without a publicSlug) stays hidden:
buffer + noindex, out of sitemap / search / LLM.

This module DECIDES visibility from existing metadata. It NEVER mints publicSlug and NEVER changes
urlStability — making a route public is a pipeline-side publication act, surfaced here only as a flag.
The page generator consumes route_visibility() to choose each page's frontmatter; the same rule will
drive config.ts gating when the family is relocated to its public path (a later slice).
"""

from __future__ import annotations


def route_visibility(segment: dict) -> dict:
    """Return the public-visibility decision for one segment metadata record.

    eligible (public) requires BOTH urlStability == "stable" AND a non-empty publicSlug — defensive
    even though the contract guarantees they move together. Anything else is hidden.
    """
    url_stability = segment.get("urlStability")
    public_slug = segment.get("publicSlug")
    has_public_slug = bool(public_slug)
    eligible = url_stability == "stable" and has_public_slug
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
