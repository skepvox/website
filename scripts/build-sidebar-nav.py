#!/usr/bin/env python3

"""Generate the local-navigation manifest (sidebar-nav.json) — podcast corpus.

Slice 2A data foundation (docs/sidebar-local-nav-model.md §4). After the legacy hand-authored
/literatura/ surface was retired (slice B5), the only generated sidebar corpus is the podcast
shows/episodes manifest, which PodcastEpisodeNav.vue consumes. The Filosofia (/pt/filosofia/) and
Literatura (/pt/literatura/) sections navigate via the global nav + SSR CardGrid hubs + the pipeline
reader shell, NOT a generated sidebar — so neither needs a corpus here. Reads the PUBLIC podcast
manifests only (no full text, no drafts/buffers). Idempotent: writes only on change.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / ".vitepress" / "theme" / "data" / "sidebar-nav.json"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


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
    return {
        "generatedBy": "scripts/build-sidebar-nav.py",
        "note": "Data foundation (Slice 2A); podcast corpus only since /literatura/ was retired (B5).",
        "corpora": [
            {
                "key": "podcast",
                "label": "Podcasts",
                "route": "/podcast/",
                "shows": podcast_shows(),
            }
        ],
    }


def main() -> None:
    manifest = build()
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print("No sidebar-nav changes.")
        return
    OUT.write_text(text, encoding="utf-8")
    shows = sum(len(c.get("shows", [])) for c in manifest["corpora"])
    print(f"sidebar-nav.json: {len(manifest['corpora'])} corpora, {shows} shows")


if __name__ == "__main__":
    main()
