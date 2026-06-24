#!/usr/bin/env python3
"""Generate a tiny website-local preview artifact for ONE pipeline segment (Slice 2E).

Joins the vendored pipeline metadata (.vitepress/theme/data/pipeline-export-segments.json) with the
ONE selected segment's sanitized prose body from the sibling book-pipeline export
(../skepvox-book-pipeline/export/prose/{author}/{book}/{language}/{segmentPrefix}.md), emitting
.vitepress/theme/data/pipeline-preview-segment.json. This is a single-segment preview — NOT a vendor
of the whole prose tree.

Join is by (segmentPrefix, language) — never by routePath. The prose leaf is already sanitized in the
pipeline (no frontmatter, no personal markers); we additionally strip the structural ##/### headings
(they are presentation context the website renders from metadata) and render the remaining paragraphs
to safe HTML (escape + *italics* only — the corpus carries no other inline markdown).

Source-absent no-op: in a clean skepvox-website checkout the sibling repo is absent; then keep the
committed artifact and no-op (mirrors scripts/build-lavelle-introduction-a-l-ontologie.py).
"""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / ".vitepress" / "theme" / "data" / "pipeline-export-segments.json"
OUT = ROOT / ".vitepress" / "theme" / "data" / "pipeline-preview-segment.json"
PROSE_ROOT = ROOT.parent / "skepvox-book-pipeline" / "export" / "prose"

# The selected representative segment: pt, a Part 1 / chapter "Ser" body paragraph.
SELECTED_LANGUAGE = "pt"
SELECTED_PREFIX = "00-01-002-008"

PERSONAL_MARKERS = ("read-at", "==", "%% review", "[!review]", "[!dt]")


def render_body_html(body: str) -> str:
    # Drop the structural ##/### headings (chapter/segment context lives in the metadata).
    lines = [ln for ln in body.splitlines() if not re.match(r"^\s*#{1,6}\s", ln)]
    text = "\n".join(lines).strip()
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    out = []
    for para in paragraphs:
        escaped = html.escape(para, quote=False)
        # *italics* -> <em> (the only inline markdown present in the sanitized corpus)
        escaped = re.sub(r"\*([^*\n]+)\*", r"<em>\1</em>", escaped)
        out.append(f"<p>{escaped}</p>")
    return "\n".join(out)


def build() -> dict | None:
    meta = json.loads(META.read_text(encoding="utf-8"))
    record = next(
        (
            s
            for s in meta["segments"]
            if s["language"] == SELECTED_LANGUAGE and s["segmentPrefix"] == SELECTED_PREFIX
        ),
        None,
    )
    if record is None:
        raise ValueError(f"selected segment not found in metadata: {SELECTED_LANGUAGE}/{SELECTED_PREFIX}")

    work = meta["work"]
    prose_path = (
        PROSE_ROOT
        / work["authorSlug"]
        / work["bookSlug"]
        / SELECTED_LANGUAGE
        / f"{SELECTED_PREFIX}.md"
    )
    if not prose_path.exists():
        return None  # sibling export absent (clean website checkout) -> keep committed artifact

    body = prose_path.read_text(encoding="utf-8")
    lowered = body.lower()
    leaked = [m for m in PERSONAL_MARKERS if m in lowered]
    if leaked:
        raise ValueError(f"prose leaf {prose_path} carries personal markers: {leaked}")

    return {
        "$schema": "skepvox-pipeline-preview-segment-v1",
        "source": "pipeline-export",
        "generatedBy": "scripts/build-pipeline-preview.py",
        "work": {"workId": work["workId"], "title": work["title"]},
        "segment": {
            "canonicalId": record["canonicalId"],
            "workId": record["workId"],
            "language": record["language"],
            "segmentPrefix": record["segmentPrefix"],
            "displayTitle": record["displayTitle"],
            "groupPath": record["groupPath"],
            "routePath": record["routePath"],
            "urlStability": record["urlStability"],
            "maturity": record["maturity"],
            "publishable": record["publishable"],
            "bodyHtml": render_body_html(body),
        },
    }


def main() -> None:
    manifest = build()
    if manifest is None:
        print("pipeline-preview: prose source absent; keeping committed artifact.")
        return
    text = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print("No pipeline-preview changes.")
        return
    OUT.write_text(text, encoding="utf-8")
    print(f"pipeline-preview-segment.json: {SELECTED_LANGUAGE}/{SELECTED_PREFIX} ({manifest['segment']['displayTitle']})")


if __name__ == "__main__":
    main()
