#!/usr/bin/env python3

"""Generate the reading-navigation manifest from committed book chapter leaves.

Reads the *generated* leaf pages under src/ (no local-books/ source required, since
that directory is gitignored/absent), orders each work's chapters by filename — the
same BB-PP-CCC[-SSS] prefix sort the book builders use — and emits one compact
manifest consumed by ReadingNav.vue:

    { "/literatura/graciliano-ramos/vidas-secas": [["00-00-001-mudanca", "Capítulo 1 — Mudança"], ...] }

The component keys into this by page.relativePath at runtime. Idempotent: writes only
on change. Touches no Markdown, no frontmatter, no book builders, no local-books/.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / ".vitepress" / "theme" / "data" / "reading-nav.json"

# Leaf reading pages: chapter files nested one level below a work directory.
# literatura/<author>/<work>/<chapter>.md and louis-lavelle/<work>/<segment>.md.
# Work hubs (one level shallower) and single-file works are excluded by glob depth.
LEAF_GLOBS = ("literatura/*/*/*.md", "louis-lavelle/*/*.md")
SKIP_NAMES = {"index.md", "readme.md"}
FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---", re.DOTALL)
# Most specific human title first; never the slug. Lavelle pt segments carry
# segment-title; literatura + Lavelle FR carry chapter-title.
TITLE_KEYS = ("segment-title", "chapter-title", "title")


def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def _frontmatter_block(path: Path) -> str:
    match = FRONTMATTER_RE.match(path.read_text(encoding="utf-8"))
    return match.group(1) if match else ""


def display_title(path: Path) -> str:
    block = _frontmatter_block(path)
    for key in TITLE_KEYS:
        found = re.search(rf"(?m)^{key}:\s*(.+?)\s*$", block)
        if found:
            return strip_quotes(found.group(1))
    return path.stem


def _is_pipeline_generated(path: Path) -> bool:
    # Pipeline-export segment-route pages carry their own data path (pipeline-export metadata +
    # PipelineSegmentRoute), separate from the hand-authored reading-nav / segment-manifest / WorkContents
    # system. Keep them out of reading-nav so that legacy system is not rewired.
    return bool(re.search(r"(?m)^generated:\s*pipeline-segment-routes\s*$", _frontmatter_block(path)))


def build() -> dict[str, list[list[str]]]:
    by_work: dict[Path, list[Path]] = defaultdict(list)
    for pattern in LEAF_GLOBS:
        for leaf in SRC.glob(pattern):
            if leaf.name.lower() in SKIP_NAMES:
                continue
            if _is_pipeline_generated(leaf):
                continue
            by_work[leaf.parent].append(leaf)

    manifest: dict[str, list[list[str]]] = {}
    for work_dir in sorted(by_work):
        leaves = sorted(by_work[work_dir], key=lambda p: p.name)
        work_route = "/" + work_dir.relative_to(SRC).as_posix()
        manifest[work_route] = [[leaf.stem, display_title(leaf)] for leaf in leaves]
    return manifest


def main() -> None:
    manifest = build()
    text = json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print("No reading-nav changes.")
        return
    OUT.write_text(text, encoding="utf-8")
    chapters = sum(len(rows) for rows in manifest.values())
    print(f"reading-nav.json: {len(manifest)} works, {chapters} chapters")


if __name__ == "__main__":
    main()
