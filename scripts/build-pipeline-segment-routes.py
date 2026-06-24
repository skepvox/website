#!/usr/bin/env python3
"""Generate the real 99-segment route family for Introdução à ontologia, kept HIDDEN (Slice 2J).

Per docs/introduction-a-ontologia-live-migration-plan.md §4(ii)/§5: stand up the actual per-segment
route family from the pipeline export, but behind buffer:true / search:false / robots noindex, fully
out of sitemap / local search / LLM output. This exercises the real route shape + the
(canonicalId, language) join + authored groupPath under production rendering, while every public
surface stays closed and the 12 live fr chapter pages + hub are untouched.

Chosen review edition: pt (the contract's canonical/default reading edition). Pages are written under
src/reading-review/introducao-a-ontologia/ — the established HIDDEN namespace, which the
reading-nav / sidebar / segment-manifest builders never sweep (their globs are literatura/louis-lavelle
only) and which config.ts already excludes from LLM output (ignoreFiles 'reading-review/**'). The leaf
filename is the pt routePath leaf (real public leaf shape); the eventual public flip relocates the
family to louis-lavelle/introducao-a-ontologia/ with redirects + stability gating (a later slice).

Each page carries the (canonicalId, language) join key in frontmatter; routePath is presentation only
and is NEVER used as an identity/join key. Reads only committed metadata; deterministic + idempotent.
"""

import json
from pathlib import Path

from pipeline_gate import route_visibility

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / ".vitepress" / "theme" / "data" / "pipeline-export-segments.json"
OUT_DIR = ROOT / "src" / "reading-review" / "introducao-a-ontologia"
EDITION = "pt"
GENERATED_MARKER = "pipeline-segment-routes"


def page_text(rec: dict) -> str:
    # Visibility is decided by the stability-aware publication gate, never hardcoded. Today every
    # segment is urlStability:draft / publicSlug:null -> hidden, so this emits buffer + search:false +
    # noindex (byte-identical to before). A stable+publicSlug segment would instead emit an indexable
    # page; nothing here mints publicSlug or changes urlStability.
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
        print(f"segment-routes: {len(desired)} hidden pt pages ({changed} changed)")


if __name__ == "__main__":
    main()
