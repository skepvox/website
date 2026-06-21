#!/usr/bin/env python3

"""Generate per-author work-card manifests for the literature author hubs.

For each hosted work it reads the work page's own frontmatter (title +
description), derives the site-root href, and writes
``src/literatura/<author>/works.json`` — a small flat list of
``{title, href, description}`` consumed by the shared CardGrid on each author
hub. The curated work order lives in WORKS below (mirroring the existing
"Obras no skepvox" lists); titles and descriptions come only from the work-page
frontmatter, never invented here. Idempotent: writes only when content changes.

Run: ``python3 scripts/build-literatura-manifests.py``
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
LITERATURA = ROOT / "src" / "literatura"

# Hosted works per author, in curated display order. This mirrors the current
# visible "Obras no skepvox" bullet order (which is identical to each hub's
# JSON-LD ItemList order) and intentionally does NOT follow filesystem /
# alphabetical order. Update this list when a hub's visible work order changes.
WORKS: dict[str, list[str]] = {
    "machado-de-assis": [
        "bras-cubas",
        "quincas-borba",
        "dom-casmurro",
        "esau-e-jaco",
        "o-alienista",
        "a-cartomante",
    ],
    "graciliano-ramos": ["sao-bernardo", "angustia", "vidas-secas"],
    "raul-pompeia": ["o-ateneu"],
}

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---", re.DOTALL)


def frontmatter_scalar(text: str, key: str) -> str:
    block = FRONTMATTER_RE.match(text)
    frontmatter = block.group(1) if block else ""
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+?)\s*$", frontmatter)
    if not match:
        return ""
    value = match.group(1)
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        value = value[1:-1]
    return value


def work_title(raw_title: str) -> str:
    """Work-page titles are "<Work> — <Author>"; the card shows just the work."""
    return raw_title.split(" — ", 1)[0].strip()


def build_author(author: str, slugs: list[str]) -> list[dict]:
    works: list[dict] = []
    for slug in slugs:
        page = LITERATURA / author / f"{slug}.md"
        if not page.is_file():
            raise SystemExit(f"missing work page: {page.relative_to(ROOT)}")
        text = page.read_text(encoding="utf-8")
        title = work_title(frontmatter_scalar(text, "title"))
        description = frontmatter_scalar(text, "description")
        if not title or not description:
            raise SystemExit(f"{page.relative_to(ROOT)}: missing title/description")
        works.append(
            {
                "title": title,
                "href": f"/literatura/{author}/{slug}",
                "description": description,
            }
        )
    return works


def main() -> None:
    changed: list[Path] = []
    for author, slugs in WORKS.items():
        manifest = build_author(author, slugs)
        out_path = LITERATURA / author / "works.json"
        text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
        if not out_path.exists() or out_path.read_text(encoding="utf-8") != text:
            out_path.write_text(text, encoding="utf-8")
            changed.append(out_path)

    if not changed:
        print("No literature manifest changes.")
        return
    for path in changed:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
