#!/usr/bin/env python3
"""Generate the real pt segment route family for Introdução à ontologia at its PUBLIC namespace.

Per docs/introduction-a-ontologia-live-migration-plan.md §4: now that the pipeline has minted
publicSlug / urlStability:stable for the pt canonical edition (vendored into
pipeline-export-segments.json), generate one page per pt segment under the real public namespace
src/louis-lavelle/introducao-a-ontologia/<routePath-leaf>.md. Per-page visibility is decided by the
stability-aware gate (scripts/pipeline_gate.py, route_visibility): stable+publicSlug -> indexable
(no buffer/search:false/noindex); draft/provisional -> hidden (buffer + search:false + noindex). Today
all 99 pt segments are stable, so all 99 are indexable public pages.

The leaf filename is the pt routePath leaf (the real public URL shape). These pages are deliberately
kept OUT of the legacy hand-authored reading system: build-reading-nav skips them (they carry a
`generated: pipeline-segment-routes` marker), and they are in no works.json registry, so reading-nav /
sidebar / segment-manifest / WorkContents are untouched. The pipeline family has its own data path
(pipeline-export metadata + PipelineSegmentRoute); a dedicated public reader nav is a later slice.
Redirects from the old fr chapter URLs are NOT enabled here (the redirect map stays
status:not-enabled); go-live is a later slice.

Each page carries the (canonicalId, language) join key in frontmatter; routePath is presentation only
and is NEVER used as an identity/join key. Reads only committed metadata; deterministic + idempotent.
"""

import json
from pathlib import Path

from pipeline_gate import route_visibility

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / ".vitepress" / "theme" / "data" / "pipeline-export-segments.json"
OUT_DIR = ROOT / "src" / "louis-lavelle" / "introducao-a-ontologia"
EDITION = "pt"
GENERATED_MARKER = "pipeline-segment-routes"


def page_text(rec: dict) -> str:
    # Visibility is decided by the stability-aware publication gate, never hardcoded. A
    # stable+publicSlug segment emits an INDEXABLE page (no buffer / search:false / noindex); a
    # draft/provisional segment emits a hidden page (buffer + search:false + noindex). Today all 99 pt
    # segments are stable, so this emits 99 indexable public pages. Nothing here mints publicSlug or
    # changes urlStability — that is the pipeline's job, surfaced via the vendored export.
    vis = route_visibility(rec)
    lines = ["---", f"title: {json.dumps(rec['displayTitle'], ensure_ascii=False)}"]
    if vis["buffer"]:
        lines.append("buffer: true")
    if not vis["search"]:
        lines.append("search: false")
    if vis["noindex"]:
        lines += ["head:", "  - ['meta', { name: 'robots', content: 'noindex' }]"]
    lines += [
        f"pipelineCanonicalId: {json.dumps(rec['canonicalId'])}",
        f"pipelineLanguage: {EDITION}",
        f"pipelineSegment: {json.dumps(rec['segmentPrefix'])}",
        f"generated: {GENERATED_MARKER}",
        "---",
    ]
    return f"{chr(10).join(lines)}\n\n<PipelineSegmentRoute />\n"


def build() -> dict[str, str]:
    meta = json.loads(META.read_text(encoding="utf-8"))
    pt = sorted(
        (s for s in meta["segments"] if s["language"] == EDITION),
        key=lambda s: s["order"],
    )
    pages: dict[str, str] = {}
    for rec in pt:
        leaf = rec["routePath"].split("/")[-1]
        pages[f"{leaf}.md"] = page_text(rec)
    return pages


def main() -> None:
    desired = build()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = {p.name for p in OUT_DIR.glob("*.md")}
    changed = 0

    # Remove stale generated pages (only ones this generator owns).
    for name in sorted(existing - set(desired)):
        text = (OUT_DIR / name).read_text(encoding="utf-8")
        if f"generated: {GENERATED_MARKER}" in text:
            (OUT_DIR / name).unlink()
            changed += 1

    for name, text in sorted(desired.items()):
        path = OUT_DIR / name
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8")
            changed += 1

    if changed == 0:
        print("No segment-routes changes.")
    else:
        print(f"segment-routes: {len(desired)} pt pages ({changed} changed)")


if __name__ == "__main__":
    main()
