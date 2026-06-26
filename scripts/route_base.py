#!/usr/bin/env python3
"""Website-owned route projection for pipeline-export books (slice A1 / IA-1).

A public segment route is composed from two independent, website-owned knobs:

    projected routePath = ROUTE_BASE[workId] + "/" + leaf(record, LEAF_POLICY)

  1. ROUTE_BASE[workId] — the full public WORK PREFIX, {locale}/{section}/{author}/{editionSlug}:
     everything BEFORE the leaf. The website owns this whole string. Today every value reproduces the
     current path EXACTLY (zero user-visible change); the locale-rooted move (A2 / IA-2) flips one
     value to "pt/filosofia/louis-lavelle/introducao-a-ontologia".
  2. LEAF_POLICY — how the per-segment leaf is formed from the segment's book-pipeline identity:
       - "vendored-slug" (today / default): leaf = the vendored final segment "<segmentPrefix>-<publicSlug>"
         (e.g. "00-01-002-008-paragrafo-7") — reproduces today's URLs byte-for-byte.
       - "prefix-only" (A2 target, NOT active yet): leaf = the bare segmentPrefix ("00-01-002-008").
         Readers never type leaf slugs; the stable segmentPrefix is already the order/pairing anchor,
         and the pretty displayTitle/publicSlug live in the UI + metadata — so the living edition can
         re-slug freely with no URL churn. (Precondition: segmentPrefix unique per edition — it is.)

Source-of-truth boundary: book-pipeline owns book IDENTITY (canonicalId, segmentPrefix, workId,
language, editionRole, publicSlug) — none mutated here. The website owns the public IA NAMESPACE: the
work prefix (ROUTE_BASE) AND the leaf policy. ROUTE_BASE never carries the displayTitle/publicSlug tail
— that tail is a leaf-policy concern, kept entirely separate, so the prefix-only switch is a policy
flip, not a ROUTE_BASE surgery. routePath is PRESENTATION only (never identity, never a join key), so
it is re-projected freely with no book-pipeline change and no reader-shell change (the shell derives
every href from routePath).

A2 / IA-2 flips BOTH knobs together: ROUTE_BASE -> "pt/filosofia/louis-lavelle/introducao-a-ontologia"
AND LEAF_POLICY -> "prefix-only", giving /pt/filosofia/louis-lavelle/introducao-a-ontologia/00-01-002-008.
The pilot's work-inclusive base is docs §6.6's "degenerate" single-published-edition case; the finer
book-pipeline-relative routeSlug split (so the website map holds only {locale}/{section}/{author}) is
deferred to the Phase-C multilingual programme per docs §6.4's future-proofing note. Implementation
prompts: docs/locale-rooted-website-ia-assessment.md §11; docs/filosofia-ia-pilot-migration-assessment.md §12.

Consumed by scripts/build-pipeline-export.py (re-projects the published edition's routePath +
routePrefix) and scripts/build-pipeline-segment-routes.py (derives its output dir from the projected
routePath). No projection logic lives in the Vue reader components.
"""

from __future__ import annotations

import argparse
import json

# workId -> full public WORK PREFIX for the PUBLISHED edition ({locale}/{section}/{author}/{editionSlug},
# everything before the leaf). CURRENT VALUE REPRODUCES TODAY'S PATH EXACTLY — zero user-visible change.
# A2 / IA-2 flips this one value (together with LEAF_POLICY -> "prefix-only"), e.g.
#   "louis-lavelle/introduction-a-l-ontologie": "pt/filosofia/louis-lavelle/introducao-a-ontologia",
ROUTE_BASE: dict[str, str] = {
    "louis-lavelle/introduction-a-l-ontologie": "louis-lavelle/introducao-a-ontologia",
}

# How the per-segment leaf is formed (the second website-owned knob). Default reproduces today's URLs;
# A2 flips it to "prefix-only". Kept SEPARATE from ROUTE_BASE so the publicSlug tail is never baked
# into the prefix (the policy can change without touching ROUTE_BASE).
LEAF_POLICY = "vendored-slug"
_LEAF_POLICIES = ("vendored-slug", "prefix-only")


def leaf_of(route_path: str) -> str:
    """The vendored final path segment ('<segmentPrefix>-<publicSlug>') of a routePath."""
    return route_path.rsplit("/", 1)[-1]


def segment_leaf(record: dict, policy: str | None = None) -> str:
    """The public leaf for a segment under the leaf policy — the only website-owned part of the leaf.

    - "vendored-slug" (default): the vendored leaf "<segmentPrefix>-<publicSlug>" (today's URL, preserved
      exactly).
    - "prefix-only": the bare, stable segmentPrefix (A2 target; readers never type leaf slugs).
    Identity is READ to form the leaf, never mutated.
    """
    policy = policy or LEAF_POLICY
    if policy not in _LEAF_POLICIES:
        raise ValueError(f"unknown LEAF_POLICY {policy!r}; expected one of {_LEAF_POLICIES}")
    if policy == "prefix-only":
        prefix = record.get("segmentPrefix")
        if not prefix:
            raise ValueError("prefix-only leaf policy requires a non-empty segmentPrefix")
        return prefix
    return leaf_of(record["routePath"])


def route_base_for(work_id: str, base: str | None = None) -> str:
    """The website work prefix for a work. `base` overrides ROUTE_BASE (the architecture guard uses it
    to demonstrate a hypothetical future base); an unmapped workId raises — a book must be registered."""
    if base is not None:
        return base
    return ROUTE_BASE[work_id]


def project_route_path(work_id: str, leaf: str, base: str | None = None) -> str:
    """Website-projected routePath = <work prefix> + '/' + <leaf>. The leaf (chosen by segment_leaf
    under LEAF_POLICY) is the caller's; ROUTE_BASE owns ONLY the prefix, never the leaf."""
    return f"{route_base_for(work_id, base)}/{leaf}"


def project_route_prefix(work_id: str, base: str | None = None) -> str:
    """Website-projected edition routePrefix = the work prefix (the leaf-less route base)."""
    return route_base_for(work_id, base)


def segment_dir_parts(route_path: str) -> tuple[str, ...]:
    """src/-relative directory parts for a segment page: the (projected) routePath minus its leaf.

    e.g. 'louis-lavelle/introducao-a-ontologia/00-00-000-001-advertencia'
         -> ('louis-lavelle', 'introducao-a-ontologia')
    """
    return tuple(route_path.split("/")[:-1])


def _main(argv: list[str] | None = None) -> int:
    """Print the projection for one segment. The architecture-guard test calls this to prove the same
    ROUTE_BASE value relocates routePath / routePrefix / OUT_DIR together, and that flipping BOTH knobs
    (base + leaf policy) yields the A2 prefix-only target — without moving anything in this slice."""
    parser = argparse.ArgumentParser(description="Project a pipeline segment route through ROUTE_BASE.")
    parser.add_argument("--work-id", required=True)
    parser.add_argument("--route-path", required=True)
    parser.add_argument("--segment-prefix", default=None, help="required for --leaf-policy prefix-only")
    parser.add_argument("--base", default=None, help="override ROUTE_BASE[workId] (a hypothetical base)")
    parser.add_argument("--leaf-policy", default=LEAF_POLICY, choices=_LEAF_POLICIES)
    args = parser.parse_args(argv)
    record = {"routePath": args.route_path, "segmentPrefix": args.segment_prefix}
    leaf = segment_leaf(record, args.leaf_policy)
    projected = project_route_path(args.work_id, leaf, args.base)
    print(
        json.dumps(
            {
                "workId": args.work_id,
                "base": route_base_for(args.work_id, args.base),
                "leafPolicy": args.leaf_policy,
                "leaf": leaf,
                "routePath": projected,
                "routePrefix": project_route_prefix(args.work_id, args.base),
                "segmentDir": "/".join(("src", *segment_dir_parts(projected))),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
