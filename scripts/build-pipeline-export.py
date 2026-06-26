#!/usr/bin/env python3
"""Reshape the vendored book-pipeline export into a website-local segment artifact.

Slice 2B (docs/website-export-ingestion-assessment.md §2/§7). Reads the vendored pipeline
metadata JSONs and emits a SEPARATE sibling artifact
`.vitepress/theme/data/pipeline-export-segments.json` tagged `source: "pipeline-export"`.

This slice is data-only: it generates no page, route, redirect, sitemap/search/LLM entry, and
does NOT merge into `segment-manifest.json` or change any consumer. `routePath` is carried as
**data only** (never an `href`). No prose body is read or emitted — prose stays in the pipeline
repo (`export/prose/...`), joined later by `(canonicalId, language)`. Authored `groupPath`
labels/titles are copied through and marked `inferred: false` (the bridge manifest infers and
marks `inferred: true`). Deterministic / idempotent: writes only when the output changes.

Route-base projection (slice A1 / IA-1, scripts/route_base.py): book-pipeline owns book identity +
the per-segment leaf; the WEBSITE owns the public `{locale}/{section}/{author}/{editionSlug}` work
prefix (ROUTE_BASE) AND the leaf policy. The PUBLISHED edition's `routePath` (per segment, =
`ROUTE_BASE[workId]` + the leaf chosen by `segment_leaf` under `LEAF_POLICY`) and
`work.editions[].routePrefix` (= `ROUTE_BASE[workId]`) are re-projected here instead of passed
through verbatim — keyed by `workId`, identity untouched. Today `ROUTE_BASE` + the default
`vendored-slug` policy reproduce the current paths byte-for-byte (zero route change); the
non-published source edition (fr) is left as-is and generates no page.
"""

import json
from pathlib import Path

from route_base import project_route_path, project_route_prefix, segment_leaf

VENDOR = Path(".vitepress/theme/data/pipeline-export")
WORK_INDEX = VENDOR / "work-index.json"
BUNDLE = VENDOR / "works" / "louis-lavelle" / "introduction-a-l-ontologie.json"
OUT = Path(".vitepress/theme/data/pipeline-export-segments.json")

# Exactly the fields this slice carries from each export segment record (allowlist — never the
# whole record, so body/personal fields can never leak). `groupPath` is adapted separately.
_SEGMENT_FIELDS = (
    "canonicalId",
    "workId",
    "language",
    "order",
    "segmentPrefix",
    "displayTitle",
    "routePath",
    "urlStability",
    "maturity",
    "publishable",
    "publicSlug",
)


def _adapt_group_path(group_path: list) -> list:
    """Export entry {kind, ordinal, label, title, key} -> website shape + authored titles.

    Website groupPath uses `index` (not `ordinal`) and an `inferred` flag. The pipeline supplies
    authored `label`/`title`, so these are `inferred: false` (vs the bridge's inferred `true`).
    """
    adapted = []
    for level in group_path:
        adapted.append(
            {
                "kind": level["kind"],
                "index": level["ordinal"],
                "label": level["label"],
                "title": level["title"],
                "key": level["key"],
                "inferred": False,
            }
        )
    return adapted


def _published_language(work: dict) -> str:
    """The single PUBLISHED edition (pilot: the pt canonical translation) whose route the website
    projects through ROUTE_BASE. Other editions (the fr source) pass through verbatim and generate no
    page in this slice. Phase C generalizes ROUTE_BASE per UI locale (docs §6.6); this is the
    degenerate single-published-edition case."""
    defaults = [e["language"] for e in work["editions"] if e.get("default")]
    if len(defaults) != 1:
        raise ValueError(f"expected exactly one default (published) edition, got {defaults}")
    return defaults[0]


def _project_editions(editions: list, work_id: str, published_language: str) -> list:
    """Re-project the published edition's `routePrefix` to `ROUTE_BASE[workId]`; every other edition
    passes through verbatim. The `routeSlug` data field is carried unchanged, but note the public
    PATH's work slug now comes from ROUTE_BASE (which, in the pilot, ends in that same own-language
    slug) — so ROUTE_BASE, not `routeSlug`, is the source of truth for the route prefix."""
    projected = []
    for edition in editions:
        if edition["language"] == published_language:
            edition = {**edition, "routePrefix": project_route_prefix(work_id)}
        projected.append(edition)
    return projected


def _segment_record(record: dict, work_id: str, published_language: str) -> dict:
    out = {field: record[field] for field in _SEGMENT_FIELDS}
    if record["language"] == published_language:
        # The website re-projects the published edition's routePath = ROUTE_BASE[workId] (the work
        # prefix) + the leaf chosen by segment_leaf under LEAF_POLICY. Today the default vendored-slug
        # policy keeps the leaf exactly; identity (canonicalId/segmentPrefix/workId/language) is
        # untouched, and routePath is presentation only. See scripts/route_base.py.
        out["routePath"] = project_route_path(work_id, segment_leaf(record))
    out["groupPath"] = _adapt_group_path(record["groupPath"])
    out["source"] = "pipeline-export"
    return out


def build() -> dict:
    bundle = json.loads(BUNDLE.read_text(encoding="utf-8"))
    work = bundle["work"]
    work_id = work["workId"]
    published_language = _published_language(work)
    segments = [
        _segment_record(record, work_id, published_language) for record in bundle["segments"]
    ]
    segments.sort(key=lambda r: (r["segmentPrefix"], r["language"]))
    return {
        "$schema": "skepvox-pipeline-export-segments-v1",
        "source": "pipeline-export",
        "generatedBy": "scripts/build-pipeline-export.py",
        "note": (
            "Website-local reshape of the book-pipeline export (metadata only, no prose). "
            "routePath is data only (never an href); no page/route/redirect is generated by this slice."
        ),
        "work": {
            "workId": work["workId"],
            "authorSlug": work["authorSlug"],
            "bookSlug": work["bookSlug"],
            "author": work["author"],
            "title": work["title"],
            "sourceLanguage": work["sourceLanguage"],
            "targetLanguage": work["targetLanguage"],
            "editions": _project_editions(work["editions"], work_id, published_language),
            "referenceEditions": work["referenceEditions"],
            "segmentCount": work["segmentCount"],
            "collapsedLevels": work["collapsedLevels"],
            "maturity": work["maturity"],
            "publishable": work["publishable"],
            "routeStability": work["routeStability"],
        },
        "segments": segments,
    }


def main() -> None:
    manifest = build()
    text = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print("No pipeline-export changes.")
        return
    OUT.write_text(text, encoding="utf-8")
    fr = sum(1 for s in manifest["segments"] if s["language"] == "fr")
    pt = sum(1 for s in manifest["segments"] if s["language"] == "pt")
    print(
        f"pipeline-export-segments.json: {len(manifest['segments'])} records "
        f"({fr} fr + {pt} pt), source=pipeline-export"
    )


if __name__ == "__main__":
    main()
