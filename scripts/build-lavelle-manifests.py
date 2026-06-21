#!/usr/bin/env python3

"""Generate the grouped work-card manifest for the Louis Lavelle hub.

Lavelle's hub groups works by language: one (or more) Portuguese translation,
then the French originals shown in chronological order with their publication
years. This mirrors the current visible "Obras no skepvox" order (corroborated
by the sidebar's within-collection chronological order) and intentionally does
NOT follow filesystem/alphabetical order.

Each card's title and description come only from that work hub's own frontmatter
(title minus the " — Louis Lavelle" suffix; description verbatim). The `meta`
line carries the publication year for the French originals and a "Tradução
pt-BR" badge for the translation — years are facts taken from the existing hub
bullets, not invented here, and no translation year is fabricated.

Output: src/louis-lavelle/works.json
  { "translationsPt": [{title, href, description, meta}],
    "frenchOriginals": [{title, href, description, meta}] }

Run: ``python3 scripts/build-lavelle-manifests.py``. Idempotent: writes only on
change.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
LAVELLE = ROOT / "src" / "louis-lavelle"

# Portuguese translation(s): (slug, meta). No real translation year is known, so
# the badge carries no year (do not invent one).
TRANSLATIONS_PT: list[tuple[str, str]] = [
    ("a-consciencia-de-si", "Tradução pt-BR"),
]

# French originals: (slug, publication year) in the hub's visible chronological
# order. These years preserve the current visible "Obras no skepvox" hub metadata
# (copied from the existing bullets); they are NOT a new bibliographic source.
FRENCH_ORIGINALS: list[tuple[str, str]] = [
    ("de-l-etre", "1928"),
    ("la-conscience-de-soi", "1933"),
    ("la-presence-totale", "1934"),
    ("de-l-acte", "1937"),
    ("l-erreur-de-narcisse", "1939"),
    ("du-temps-et-de-l-eternite", "1945"),
    ("introduction-a-l-ontologie", "1947"),
    ("de-l-ame-humaine", "1951"),
    ("quatre-saints", "1951"),
]

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
    """Work-page titles are "<Work> — Louis Lavelle"; the card shows just the work."""
    return raw_title.split(" — ", 1)[0].strip()


def build_entry(slug: str, meta: str) -> dict:
    page = LAVELLE / f"{slug}.md"
    if not page.is_file():
        raise SystemExit(f"missing work page: {page.relative_to(ROOT)}")
    text = page.read_text(encoding="utf-8")
    title = work_title(frontmatter_scalar(text, "title"))
    description = frontmatter_scalar(text, "description")
    if not title or not description:
        raise SystemExit(f"{page.relative_to(ROOT)}: missing title/description")
    return {
        "title": title,
        "href": f"/louis-lavelle/{slug}",
        "description": description,
        "meta": meta,
    }


def main() -> None:
    manifest = {
        "translationsPt": [build_entry(slug, meta) for slug, meta in TRANSLATIONS_PT],
        "frenchOriginals": [build_entry(slug, meta) for slug, meta in FRENCH_ORIGINALS],
    }
    out_path = LAVELLE / "works.json"
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if not out_path.exists() or out_path.read_text(encoding="utf-8") != text:
        out_path.write_text(text, encoding="utf-8")
        print(out_path.relative_to(ROOT))
    else:
        print("No Lavelle manifest changes.")


if __name__ == "__main__":
    main()
