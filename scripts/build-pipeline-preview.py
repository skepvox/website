#!/usr/bin/env python3
"""Generate tiny website-local preview artifacts from the pipeline export (Slice 2E/2F).

Joins the vendored pipeline metadata (.vitepress/theme/data/pipeline-export-segments.json) with a
FEW selected segments' sanitized prose bodies from the sibling book-pipeline export
(../skepvox-book-pipeline/export/prose/{author}/{book}/{language}/{segmentPrefix}.md). Emits:

  - pipeline-preview-segment.json  : ONE segment (Slice 2E single-leaf preview)
  - pipeline-preview-window.json   : a small contiguous WINDOW of segments (Slice 2F reading flow)

These are small previews — NOT a vendor of the whole prose tree. Join is by (segmentPrefix, language),
never by routePath. Each prose leaf is already sanitized in the pipeline (no frontmatter, no personal
markers); we additionally strip the structural ##/### headings (presentation context the website
renders from metadata) and render the remaining paragraphs to safe HTML (escape + *italics* only — the
corpus carries no other inline markdown).

Source-absent no-op: in a clean skepvox-website checkout the sibling repo is absent; then keep the
committed artifacts and no-op (mirrors scripts/build-lavelle-introduction-a-l-ontologie.py).
"""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / ".vitepress" / "theme" / "data" / "pipeline-export-segments.json"
OUT_SEGMENT = ROOT / ".vitepress" / "theme" / "data" / "pipeline-preview-segment.json"
OUT_WINDOW = ROOT / ".vitepress" / "theme" / "data" / "pipeline-preview-window.json"
PROSE_ROOT = ROOT.parent / "skepvox-book-pipeline" / "export" / "prose"

# Single-leaf preview (2E): pt, a Part 1 / chapter "Ser" body paragraph.
SELECTED_LANGUAGE = "pt"
SELECTED_PREFIX = "00-01-002-008"

# Reading-flow window (2F): a contiguous run of pt segments by order, around the sample. Orders 6-10
# span the Distinção -> Ser chapter boundary, exercising per-segment groupPath in the overview.
WINDOW_LANGUAGE = "pt"
WINDOW_ORDER_MIN = 6
WINDOW_ORDER_MAX = 10
WINDOW_CURRENT_PREFIX = "00-01-002-008"

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


def _payload(record: dict, work: dict) -> dict | None:
    """Segment payload (metadata + sanitized bodyHtml), or None if the prose leaf is absent."""
    prose_path = (
        PROSE_ROOT
        / work["authorSlug"]
        / work["bookSlug"]
        / record["language"]
        / f"{record['segmentPrefix']}.md"
    )
    if not prose_path.exists():
        return None
    body = prose_path.read_text(encoding="utf-8")
    leaked = [m for m in PERSONAL_MARKERS if m in body.lower()]
    if leaked:
        raise ValueError(f"prose leaf {prose_path} carries personal markers: {leaked}")
    return {
        "canonicalId": record["canonicalId"],
        "workId": record["workId"],
        "language": record["language"],
        "segmentPrefix": record["segmentPrefix"],
        "order": record["order"],
        "displayTitle": record["displayTitle"],
        "groupPath": record["groupPath"],
        "routePath": record["routePath"],
        "urlStability": record["urlStability"],
        "maturity": record["maturity"],
        "publishable": record["publishable"],
        "bodyHtml": render_body_html(body),
    }


def build_single(meta: dict) -> dict | None:
    work = meta["work"]
    record = next(
        (
            s
            for s in meta["segments"]
            if s["language"] == SELECTED_LANGUAGE and s["segmentPrefix"] == SELECTED_PREFIX
        ),
        None,
    )
    if record is None:
        raise ValueError(f"selected segment not found: {SELECTED_LANGUAGE}/{SELECTED_PREFIX}")
    payload = _payload(record, work)
    if payload is None:
        return None
    return {
        "$schema": "skepvox-pipeline-preview-segment-v1",
        "source": "pipeline-export",
        "generatedBy": "scripts/build-pipeline-preview.py",
        "work": {"workId": work["workId"], "title": work["title"]},
        "segment": payload,
    }


def build_window(meta: dict) -> dict | None:
    work = meta["work"]
    records = sorted(
        (
            s
            for s in meta["segments"]
            if s["language"] == WINDOW_LANGUAGE
            and WINDOW_ORDER_MIN <= s["order"] <= WINDOW_ORDER_MAX
        ),
        key=lambda s: s["order"],
    )
    if not records:
        raise ValueError(
            f"no window segments for {WINDOW_LANGUAGE} orders {WINDOW_ORDER_MIN}-{WINDOW_ORDER_MAX}"
        )
    payloads = []
    for record in records:
        payload = _payload(record, work)
        if payload is None:
            return None  # any leaf absent -> keep committed window artifact
        payloads.append(payload)
    return {
        "$schema": "skepvox-pipeline-preview-window-v1",
        "source": "pipeline-export",
        "generatedBy": "scripts/build-pipeline-preview.py",
        "work": {"workId": work["workId"], "title": work["title"]},
        "current": WINDOW_CURRENT_PREFIX,
        "segments": payloads,
    }


def _write(out: Path, manifest: dict | None, label: str) -> None:
    if manifest is None:
        print(f"pipeline-preview ({label}): prose source absent; keeping committed artifact.")
        return
    text = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists() and out.read_text(encoding="utf-8") == text:
        print(f"No pipeline-preview ({label}) changes.")
        return
    out.write_text(text, encoding="utf-8")
    print(f"{out.name}: written ({label})")


def main() -> None:
    meta = json.loads(META.read_text(encoding="utf-8"))
    _write(OUT_SEGMENT, build_single(meta), "segment")
    _write(OUT_WINDOW, build_window(meta), "window")


if __name__ == "__main__":
    main()
