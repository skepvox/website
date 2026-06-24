#!/usr/bin/env python3
"""Generate the old->new 301 redirect map for the 12 live fr chapter URLs of Introdução à ontologia
(Slice 2I). DATA/DOC ONLY — this is NOT wired into any redirect channel (no src/public/_redirects);
the artifact carries status:"not-enabled".

Maps each current fr chapter-level page under src/louis-lavelle/introduction-a-l-ontologie/ to the
FIRST fr segment route of the same chapter — the lowest SSS sharing that chapter's BB-PP-CCC prefix —
using the vendored pipeline export metadata (.vitepress/theme/data/pipeline-export-segments.json,
fr edition). routePath is presentation-only and is used here solely to address the new public URL;
it is never an identity/join key. Deterministic + idempotent (reads only committed files).
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / ".vitepress" / "theme" / "data" / "pipeline-export-segments.json"
LEAVES = ROOT / "src" / "louis-lavelle" / "introduction-a-l-ontologie"
OUT = ROOT / ".vitepress" / "theme" / "data" / "pipeline-redirect-map-introduction-a-l-ontologie.json"

ROUTE_BASE = "/louis-lavelle/introduction-a-l-ontologie"
EDITION = "fr"
FRONT_PREFIX = "00-00-000"
CONCLUSION_PREFIX = "99-99-999"
PREFIX_RE = re.compile(r"^(\d\d-\d\d-\d\d\d)-")


def chapter_prefix(name: str) -> str:
    m = PREFIX_RE.match(name)
    if not m:
        raise ValueError(f"cannot derive chapter prefix from {name!r}")
    return m.group(1)


def build() -> dict:
    meta = json.loads(META.read_text(encoding="utf-8"))
    work = meta["work"]
    fr = [s for s in meta["segments"] if s["language"] == EDITION]

    # First fr segment routePath per chapter prefix (lowest SSS = min by zero-padded segmentPrefix).
    first_by_chapter: dict[str, dict] = {}
    for seg in fr:
        cp = chapter_prefix(seg["segmentPrefix"])
        cur = first_by_chapter.get(cp)
        if cur is None or seg["segmentPrefix"] < cur["segmentPrefix"]:
            first_by_chapter[cp] = seg

    def chapter_title(seg: dict) -> str | None:
        c = next((lvl for lvl in seg["groupPath"] if lvl["kind"] == "chapter"), None)
        return (c["title"] or c["label"]) if c else None

    stems = sorted(p.stem for p in LEAVES.glob("*.md"))
    entries = []
    for stem in stems:
        cp = chapter_prefix(stem)
        target = first_by_chapter.get(cp)
        if target is None:
            raise ValueError(f"no fr segment for chapter prefix {cp} (old page {stem})")
        if cp == FRONT_PREFIX:
            note = "Front matter — 1:1 (single front-matter segment)."
        elif cp == CONCLUSION_PREFIX:
            note = (
                "Conclusion — maps to the first conclusion segment (99-99-999-096). "
                "Segments 097-099 are new segment routes with no old-URL source (no redirect)."
            )
        else:
            title = chapter_title(target)
            note = f"First fr segment of chapter “{title}”." if title else "First fr segment of chapter."
        entries.append(
            {
                "oldPath": f"{ROUTE_BASE}/{stem}",
                "targetPath": f"/{target['routePath']}",
                "statusCode": 301,
                "chapterPrefix": cp,
                "note": note,
            }
        )

    return {
        "$schema": "skepvox-pipeline-redirect-map-v1",
        "generatedBy": "scripts/build-pipeline-redirect-map.py",
        "source": "pipeline-export",
        "status": "not-enabled",
        "work": {
            "workId": work["workId"],
            "edition": EDITION,
            "routeSlug": "introduction-a-l-ontologie",
        },
        "note": (
            "Old fr chapter URL -> first fr segment route of the same chapter (BB-PP-CCC, lowest SSS). "
            "NOT wired into any redirect channel (src/public/_redirects is absent). routePath is "
            "presentation-only; identity is canonicalId. Targets are chapter-level: paragraph-level "
            "deep links have no old-URL source."
        ),
        "entries": entries,
    }


def main() -> None:
    manifest = build()
    text = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print("No redirect-map changes.")
        return
    OUT.write_text(text, encoding="utf-8")
    print(f"{OUT.name}: {len(manifest['entries'])} entries (status: not-enabled)")


if __name__ == "__main__":
    main()
