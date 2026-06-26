#!/usr/bin/env python3
"""Reshape the vendored book-pipeline export into a website-local segment artifact.

Slice 2B (docs/website-export-ingestion-assessment.md §2/§7), generalized to MULTI-WORK in slice B2:
reads the vendored `work-index.json` + every per-work bundle it lists, and emits a SEPARATE sibling
artifact `.vitepress/theme/data/pipeline-export-segments.json` tagged `source: "pipeline-export"` with a
`works: [...]` array (one record per vendored work — Lavelle + Brás Cubas) and a unified `segments`
array carrying each record's `workId`. Consumers filter by `(workId, language)`; no per-work generator.

This slice is data-only: it generates no page, route, redirect, sitemap/search/LLM entry, and does NOT
merge into `segment-manifest.json` or change any rented consumer. `routePath` is carried as **data only**
(never an `href`). No prose body is read or emitted — prose stays in the pipeline repo
(`export/prose/...`), joined later by `(workId, language, segmentPrefix)`. Authored `groupPath`
labels/titles are copied through and marked `inferred: false`. Deterministic / idempotent: writes only
when the output changes.

Route-base projection (slice A1 / IA-1, scripts/route_base.py): book-pipeline owns book identity + the
per-segment leaf; the WEBSITE owns the public `{locale}/{section}/{author}/{editionSlug}` work prefix
(ROUTE_BASE, keyed by `workId`) AND the leaf policy. Each work's PUBLISHED edition's per-segment
`routePath` (= `ROUTE_BASE[workId]` + the leaf chosen by `segment_leaf` under `LEAF_POLICY`) and
`work.editions[].routePrefix` (= `ROUTE_BASE[workId]`) are re-projected here, keyed by `workId`; identity
(canonicalId/segmentPrefix/workId/language) is never touched.
"""

import json
from pathlib import Path

from route_base import project_route_path, project_route_prefix, segment_leaf

VENDOR = Path(".vitepress/theme/data/pipeline-export")
WORK_INDEX = VENDOR / "work-index.json"
OUT = Path(".vitepress/theme/data/pipeline-export-segments.json")

# Exactly the fields this slice carries from each export segment record (allowlist — never the whole
# record, so body/personal fields can never leak). `groupPath` is adapted separately; `workId` is the
# per-work filter key.
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

# The work-record fields carried per work (no segments, no prose).
_WORK_FIELDS = (
    "workId",
    "authorSlug",
    "bookSlug",
    "author",
    "title",
    "sourceLanguage",
    "targetLanguage",
    "referenceEditions",
    "segmentCount",
    "collapsedLevels",
    "maturity",
    "publishable",
    "routeStability",
)


def _adapt_group_path(group_path: list) -> list:
    """Export entry {kind, ordinal, label, title, key} -> website shape + authored titles.

    Website groupPath uses `index` (not `ordinal`) and an `inferred` flag. The pipeline supplies
    authored `label`/`title`, so these are `inferred: false` (vs the bridge's inferred `true`).
    """
    return [
        {
            "kind": level["kind"],
            "index": level["ordinal"],
            "label": level["label"],
            "title": level["title"],
            "key": level["key"],
            "inferred": False,
        }
        for level in group_path
    ]


def _published_language(work: dict) -> str:
    """The single PUBLISHED (default) edition whose route the website projects through ROUTE_BASE.
    Other editions (e.g. a source edition) pass through verbatim and generate no page in this slice."""
    defaults = [e["language"] for e in work["editions"] if e.get("default")]
    if len(defaults) != 1:
        raise ValueError(f"expected exactly one default (published) edition, got {defaults}")
    return defaults[0]


def _project_editions(editions: list, work_id: str, published_language: str) -> list:
    """Re-project the published edition's `routePrefix` to `ROUTE_BASE[workId]`; every other edition
    passes through verbatim. ROUTE_BASE (not `routeSlug`) is the source of truth for the route prefix."""
    return [
        {**edition, "routePrefix": project_route_prefix(work_id)}
        if edition["language"] == published_language
        else edition
        for edition in editions
    ]


def _segment_record(record: dict, work_id: str, published_language: str) -> dict:
    out = {field: record[field] for field in _SEGMENT_FIELDS}
    if record["language"] == published_language:
        # The website re-projects the published edition's routePath = ROUTE_BASE[workId] (the work
        # prefix) + the leaf chosen by segment_leaf under LEAF_POLICY (prefix-only). Identity
        # (canonicalId/segmentPrefix/workId/language) is untouched; routePath is presentation only.
        out["routePath"] = project_route_path(work_id, segment_leaf(record))
    out["groupPath"] = _adapt_group_path(record["groupPath"])
    out["source"] = "pipeline-export"
    return out


def _reshape_work(bundle: dict) -> tuple[dict, list]:
    work = bundle["work"]
    work_id = work["workId"]
    published_language = _published_language(work)
    segments = [
        _segment_record(record, work_id, published_language) for record in bundle["segments"]
    ]
    work_record = {field: work[field] for field in _WORK_FIELDS}
    work_record["editions"] = _project_editions(work["editions"], work_id, published_language)
    return work_record, segments


def build() -> dict:
    index = json.loads(WORK_INDEX.read_text(encoding="utf-8"))
    works: list = []
    segments: list = []
    for entry in index["works"]:
        bundle = json.loads((VENDOR / entry["bundlePath"]).read_text(encoding="utf-8"))
        work_record, work_segments = _reshape_work(bundle)
        works.append(work_record)
        segments.extend(work_segments)
    works.sort(key=lambda w: w["workId"])
    # workId first so segmentPrefix ranges never collide across works.
    segments.sort(key=lambda r: (r["workId"], r["segmentPrefix"], r["language"]))
    return {
        "$schema": "skepvox-pipeline-export-segments-v1",
        "source": "pipeline-export",
        "generatedBy": "scripts/build-pipeline-export.py",
        "note": (
            "Website-local reshape of the book-pipeline export (metadata only, no prose), multi-work. "
            "routePath is data only (never an href); no page/route/redirect is generated by this slice."
        ),
        "works": works,
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
    per_work = {
        w["workId"]: sum(1 for s in manifest["segments"] if s["workId"] == w["workId"])
        for w in manifest["works"]
    }
    print(
        f"pipeline-export-segments.json: {len(manifest['works'])} works, "
        f"{len(manifest['segments'])} records ({per_work}), source=pipeline-export"
    )


if __name__ == "__main__":
    main()
