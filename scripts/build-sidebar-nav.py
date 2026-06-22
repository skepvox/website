#!/usr/bin/env python3

"""Generate the local-navigation manifest (sidebar-nav.json) from committed sources.

This is the Slice 2A *data foundation* from docs/sidebar-local-nav-model.md §4: it
composes the existing, already-committed manifests into one deterministic local-nav
tree. It changes NO visible navigation — nothing consumes sidebar-nav.json yet, and
config.ts remains the live sidebar source. The manifest exists so later slices
(EpisodeNav, an owned up-line, an optional switcher, or a generated config.sidebar
projection) can read one source of truth instead of the hand-maintained config.ts.

Reads committed repo data only (no local-books/, no node_modules, no frontmatter beyond
what the manifests already encode):
  - .vitepress/theme/data/reading-nav.json  -> reading-leaf counts + multi/single kind
  - src/literatura/<author>/works.json      -> literature works (title, href, year)
  - .vitepress/theme/components/authors.ts   -> literature author order + labels
  - src/louis-lavelle/works.json             -> Lavelle translated / original works
  - src/podcast/shows.json + <show>/episodes.json -> shows + PUBLIC episodes only

`kind` is "multi-leaf" when the work has a reading-nav.json key (it is split into
reading leaves — chapters in literature, sections/segments·trechos in Lavelle), else
"single-file" (one page, e.g. A Cartomante / O Ateneu). `leaves` is the split-leaf
count (0 for single-file). No full text, no generated prose. Idempotent: writes only on
change, mirroring build-reading-nav.py.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / ".vitepress" / "theme" / "data" / "sidebar-nav.json"

READING_NAV = ROOT / ".vitepress" / "theme" / "data" / "reading-nav.json"
AUTHORS_TS = ROOT / ".vitepress" / "theme" / "components" / "authors.ts"

# Corpus order mirrors the user-facing global nav in config.ts (Home, Lavelle,
# Literatura, Podcasts). Within each corpus, order is taken verbatim from the existing
# user-facing manifests (authors.ts / works.json / shows.json / episodes.json).
CORPUS_ORDER = ["louis-lavelle", "literatura", "podcast"]

# Lavelle group labels mirror the headings on the Lavelle hub (src/louis-lavelle/index.md).
LAVELLE_GROUPS = [
    ("translationsPt", "Obras traduzidas"),
    ("frenchOriginals", "Obras originais"),
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def reading_nav_index() -> dict[str, int]:
    """Map each multi-leaf work-route -> its reading-leaf count."""
    data = load_json(READING_NAV)
    return {route: len(rows) for route, rows in data.items()}


def classify(href: str, leaf_counts: dict[str, int]) -> dict:
    """kind + leaf count for a work, derived from reading-nav.json membership."""
    if href in leaf_counts:
        return {"kind": "multi-leaf", "leaves": leaf_counts[href]}
    return {"kind": "single-file", "leaves": 0}


def work_entry(raw: dict, leaf_counts: dict[str, int]) -> dict:
    entry = {"title": raw["title"], "href": raw["href"]}
    entry.update(classify(raw["href"], leaf_counts))
    if raw.get("meta"):
        entry["meta"] = raw["meta"]
    return entry


def literature_authors(leaf_counts: dict[str, int]) -> list[dict]:
    # Author order + labels come from authors.ts (the /literatura/ hub CardGrid order).
    pairs = re.findall(
        r"title:\s*'([^']+)',\s*\n\s*href:\s*'(/literatura/[^']+/)'",
        AUTHORS_TS.read_text(encoding="utf-8"),
    )
    authors = []
    for label, route in pairs:
        slug = route.strip("/").split("/")[-1]
        works_path = SRC / "literatura" / slug / "works.json"
        works = load_json(works_path) if works_path.exists() else []
        authors.append(
            {
                "label": label,
                "route": route,
                "works": [work_entry(w, leaf_counts) for w in works],
            }
        )
    return authors


def lavelle_groups(leaf_counts: dict[str, int]) -> list[dict]:
    data = load_json(SRC / "louis-lavelle" / "works.json")
    groups = []
    for key, label in LAVELLE_GROUPS:
        works = data.get(key, [])
        groups.append(
            {
                "key": key,
                "label": label,
                "works": [work_entry(w, leaf_counts) for w in works],
            }
        )
    return groups


def podcast_shows() -> list[dict]:
    shows = load_json(SRC / "podcast" / "shows.json")
    out = []
    for show in shows:
        key = show["href"].strip("/").split("/")[-1]
        episodes = load_json(SRC / "podcast" / key / "episodes.json")
        out.append(
            {
                "title": show["title"],
                "href": show["href"],
                "meta": show.get("meta", ""),
                "episodeCount": show.get("episodeCount", len(episodes)),
                # episodes.json is the PUBLIC manifest (buffers/drafts excluded upstream).
                "episodes": [
                    {"number": ep["number"], "title": ep["title"], "href": ep["href"]}
                    for ep in episodes
                ],
            }
        )
    return out


def build() -> dict:
    leaf_counts = reading_nav_index()
    corpora_by_key = {
        "louis-lavelle": {
            "key": "louis-lavelle",
            "label": "Louis Lavelle",
            "route": "/louis-lavelle/",
            "groups": lavelle_groups(leaf_counts),
        },
        "literatura": {
            "key": "literatura",
            "label": "Literatura",
            "route": "/literatura/",
            "authors": literature_authors(leaf_counts),
        },
        "podcast": {
            "key": "podcast",
            "label": "Podcasts",
            "route": "/podcast/",
            "shows": podcast_shows(),
        },
    }
    return {
        "generatedBy": "scripts/build-sidebar-nav.py",
        "note": "Data foundation only (Slice 2A); not wired to navigation. config.ts is the live sidebar source.",
        "corpora": [corpora_by_key[k] for k in CORPUS_ORDER],
    }


def main() -> None:
    manifest = build()
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print("No sidebar-nav changes.")
        return
    OUT.write_text(text, encoding="utf-8")
    works = 0
    for corpus in manifest["corpora"]:
        for author in corpus.get("authors", []):
            works += len(author["works"])
        for group in corpus.get("groups", []):
            works += len(group["works"])
    shows = sum(len(c.get("shows", [])) for c in manifest["corpora"])
    print(f"sidebar-nav.json: {len(manifest['corpora'])} corpora, {works} works, {shows} shows")


if __name__ == "__main__":
    main()
