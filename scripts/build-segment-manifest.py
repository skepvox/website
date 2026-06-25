#!/usr/bin/env python3

"""Generate the provisional segment-manifest — Slice a of the reading-app redesign.

This is the DATA FOUNDATION step from docs/reading-app-segment-workhub-assessment.md: a
generated bridge manifest that establishes durable per-segment identity (`canonicalId`) and
a conservative authored hierarchy (`groupPath`) BEFORE any WorkContents / zoom-out UI exists.
It changes no visible navigation and is wired into no component yet.

It reads COMMITTED WEBSITE DATA ONLY:
  - .vitepress/theme/data/reading-nav.json  -> the ordered reading leaves + display titles
  - .vitepress/theme/data/sidebar-nav.json  -> the work list (incl. single-file works) + titles
  - src/ leaf/work paths                     -> existence checks

It does NOT read skepvox-book-pipeline or Kairos. It is explicitly a BRIDGE, designed so a
future version can ingest the pipeline `sync-map.yaml` + segment frontmatter (which carry the
real `canonical-id`, authored titles, `segment-kind`, review/reading state). Until then:
  - `canonicalId` is a PROVISIONAL, deterministic id = {author}/{work}/{numeric-prefix}; it is
    never the route href and never the route slug. Route fields (href/relativePath/slug/
    displayTitle) are presentation, kept separate from identity.
  - `groupPath` is a CONSERVATIVE projection from the numeric prefix only, with absent levels
    omitted (not null-filled) and every derived level marked `inferred: true` (no authored
    titles are available in committed website data). The legacy website `PP` is a known
    synthetic bucket (chapter-decade pagination in the Machado novels), so it is NOT projected
    as an authored "part" for chapter-level leaves.
  - `semanticMaturity` is "unknown" everywhere: committed website data does not prove that a
    leaf represents the canonical segment/trecho. `urlStability` is "preserve" (public URLs are
    SEO-sensitive; identity lives in canonicalId, not the slug).

Scope: literatura + louis-lavelle reading surfaces. Podcasts are handled separately
(PodcastEpisodeNav) and are out of scope. No prose is emitted. Idempotent: writes only on
change, mirroring build-reading-nav.py / build-sidebar-nav.py.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DATA = ROOT / ".vitepress" / "theme" / "data"
READING_NAV = DATA / "reading-nav.json"
SIDEBAR_NAV = DATA / "sidebar-nav.json"
OUT = DATA / "segment-manifest.json"

# Fixed-width prefix grammar (BB=2, PP=2, CCC=3, SSS=3). SSS present => segment-level leaf.
SEG_RE = re.compile(r"^(\d{2})-(\d{2})-(\d{3})-(\d{3})(?:-|$)")  # BB-PP-CCC-SSS
CHP_RE = re.compile(r"^(\d{2})-(\d{2})-(\d{3})(?:-|$)")  # BB-PP-CCC

FRONT_MATTER_PREFIX = "00-00-000"
CONCLUSION_PREFIX = "99-99-999"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def parse_route(route: str) -> dict:
    """A work route -> {corpus, author, work, workId}. workId = {author}/{work} (drops the
    corpus, mirroring the pipeline's {author-slug}/{book-slug} identity form)."""
    parts = route.strip("/").split("/")
    if parts[0] == "literatura":
        corpus, author, work = "literatura", parts[1], parts[2]
    elif parts[0] == "louis-lavelle":
        corpus, author, work = "louis-lavelle", "louis-lavelle", parts[1]
    else:
        corpus, author, work = parts[0], parts[0], parts[-1]
    return {"corpus": corpus, "author": author, "work": work, "workId": f"{author}/{work}"}


FM_LANGUAGE_RE = re.compile(r"(?m)^language:\s*[\"']?([A-Za-z]{2})")


def work_language(rel_path: str, corpus: str) -> str:
    """Base language code for the work, read from its hub frontmatter (authoritative); falls back
    to the corpus default. Used by WorkContents to localize group-level labels (Livre/Livro/Book)."""
    fpath = SRC / rel_path
    if fpath.exists():
        match = FM_LANGUAGE_RE.search(fpath.read_text(encoding="utf-8"))
        if match:
            return match.group(1).lower()
    return "fr" if corpus == "louis-lavelle" else "pt"


def classify(rows: list) -> str:
    """A work is 'segment-level' iff every leaf carries an SSS; 'chapter-level' iff none do;
    'mixed' otherwise (defensive — does not occur in current data)."""
    seg = sum(1 for slug, _ in rows if SEG_RE.match(slug))
    if seg == len(rows):
        return "segment-level"
    if seg == 0:
        return "chapter-level"
    return "mixed"


def group_path(work_id: str, bb: str, pp: str, ccc: str, is_segment: bool, bucket: str | None) -> list:
    """Conservative authored hierarchy ABOVE the segment, derived from the numeric prefix only.
    Absent levels are omitted. Every level is marked inferred (no authored titles in committed
    website data) and carries a stable `key` (= work + index-path) so a future collapsible
    WorkContents can key group headers / aria-controls / collapse state off it WITHOUT parsing
    slugs; segments in the same group share the same key. Reserved front-matter/conclusion
    buckets are work-level -> no levels."""
    if bucket:
        return []
    path = []
    # BB reliably encodes an internal book/volume where present (e.g. Lavelle de-l-acte 01..03);
    # 0 = no book division, 99 = reserved (handled as a bucket above).
    if int(bb) not in (0, 99):
        path.append({"kind": "book", "index": int(bb), "key": f"{work_id}/{bb}", "inferred": True})
    # The legacy website PP is an unreliable synthetic bucket for chapter-level works (it
    # paginates chapters by decade in the Machado novels), so it is projected as an authored
    # part ONLY for genuine segment-level leaves (where the segment sits below the chapter).
    if is_segment and int(pp) not in (0, 99):
        path.append(
            {"kind": "part", "index": int(pp), "key": f"{work_id}/{bb}-{pp}", "inferred": True}
        )
    # For a segment-level leaf the chapter is a real grouping level above the segment; for a
    # chapter-level leaf the chapter IS the segment, so it is not a level above it.
    if is_segment:
        path.append(
            {"kind": "chapter", "index": int(ccc), "key": f"{work_id}/{bb}-{pp}-{ccc}", "inferred": True}
        )
    return path


def segment_record(route: str, ids: dict, slug: str, title: str, order: int, work_class: str) -> dict:
    work_route = route.rstrip("/")
    href = f"{work_route}/{slug}"
    rel = f"{work_route.lstrip('/')}/{slug}.md"
    rec = {
        "canonicalId": "",  # filled below
        "workId": ids["workId"],
        "order": order,
        "segmentKind": "chapter",
        "prefixCompatibility": work_class,
        "groupPath": [],
        "href": href,
        "relativePath": rel,
        "slug": slug,
        "displayTitle": title,
        "source": "website-committed",
        "semanticMaturity": "unknown",
        "urlStability": "preserve",
    }

    seg = SEG_RE.match(slug)
    chp = CHP_RE.match(slug)
    if work_class == "segment-level" and seg:
        bb, pp, ccc, sss = seg.groups()
        prefix = f"{bb}-{pp}-{ccc}-{sss}"
        chapter_prefix = f"{bb}-{pp}-{ccc}"
        rec["segmentKind"] = "segment"
        rec["segmentIndex"] = int(sss)
    elif chp:
        bb, pp, ccc = chp.groups()
        prefix = f"{bb}-{pp}-{ccc}"
        chapter_prefix = prefix
    else:  # defensive: unparseable prefix (does not occur in current data)
        rec["canonicalId"] = f"{ids['workId']}/{slug}"
        rec["segmentKind"] = "unknown"
        rec["groupPath"] = []
        return rec

    bucket = (
        "front-matter"
        if chapter_prefix == FRONT_MATTER_PREFIX
        else "conclusion"
        if chapter_prefix == CONCLUSION_PREFIX
        else None
    )
    rec["canonicalId"] = f"{ids['workId']}/{prefix}"
    rec["prefix"] = prefix
    rec["bookIndex"] = int(bb)
    rec["partIndex"] = int(pp)
    rec["chapterIndex"] = int(ccc)
    if bucket:
        rec["bucket"] = bucket
    rec["groupPath"] = group_path(
        ids["workId"], bb, pp, ccc, is_segment=(work_class == "segment-level"), bucket=bucket
    )
    return rec


def single_file_segment(ids: dict, href: str, title: str) -> dict:
    """A single-file work is one reading leaf = the work page itself (no BB-PP-CCC prefix)."""
    return {
        "canonicalId": ids["workId"],
        "workId": ids["workId"],
        "order": 0,
        "segmentKind": "single-file",
        "prefixCompatibility": "single-file",
        "groupPath": [],
        "href": href.rstrip("/"),
        "relativePath": f"{href.strip('/')}.md",
        "slug": ids["work"],
        "displayTitle": title,
        "source": "website-committed",
        "semanticMaturity": "unknown",
        "urlStability": "preserve",
    }


def iter_works(sidebar: dict):
    """Yield (work_dict) for literatura + louis-lavelle works, in sidebar-nav order."""
    for corpus in sidebar["corpora"]:
        if corpus["key"] == "literatura":
            for author in corpus.get("authors", []):
                for w in author["works"]:
                    yield w
        elif corpus["key"] == "louis-lavelle":
            for group in corpus.get("groups", []):
                for w in group["works"]:
                    yield w
        # podcast and any other corpus: out of scope


def build() -> dict:
    reading = load(READING_NAV)
    sidebar = load(SIDEBAR_NAV)

    works = []
    segments = []
    for w in iter_works(sidebar):
        if w.get("kind") == "pipeline-export":
            # Pipeline-exported works have their own identity/prose/navigation artifacts
            # (pipeline-export-segments.json + generated route family). This bridge manifest
            # remains scoped to the older website-committed reading surfaces and must not
            # downcast a pipeline work hub to a legacy single-file segment.
            continue
        route = w["href"].rstrip("/")
        ids = parse_route(route)
        rows = reading.get(route)
        if rows:
            work_class = classify(rows)
            for order, (slug, title) in enumerate(rows):
                seg = segment_record(route, ids, slug, title, order, work_class)
                if not (SRC / seg["relativePath"]).exists():
                    raise SystemExit(f"missing leaf source: {seg['relativePath']}")
                segments.append(seg)
            leaf_count = len(rows)
            kind = "multi-leaf"
        else:
            work_class = "single-file"
            seg = single_file_segment(ids, route, w["title"])
            if not (SRC / seg["relativePath"]).exists():
                raise SystemExit(f"missing single-file source: {seg['relativePath']}")
            segments.append(seg)
            leaf_count = 1
            kind = "single-file"

        works.append(
            {
                "workId": ids["workId"],
                "corpus": ids["corpus"],
                "author": ids["author"],
                "work": ids["work"],
                "displayTitle": w["title"],
                "language": work_language(f"{route.lstrip('/')}.md", ids["corpus"]),
                "href": route,
                "relativePath": f"{route.lstrip('/')}.md",
                "kind": kind,
                "leafCount": leaf_count,
                "prefixCompatibility": work_class,
                "semanticMaturity": "unknown",
                "urlStability": "preserve",
            }
        )

    return {
        "$schema": "skepvox-segment-manifest-v0",
        "generatedBy": "scripts/build-segment-manifest.py",
        "source": "website-committed",
        "scope": ["literatura", "louis-lavelle"],
        "note": (
            "Provisional bridge manifest (reading-app Slice a). Durable segment identity "
            "(canonicalId) + conservative authored hierarchy (groupPath, inferred from the "
            "numeric prefix only) derived from committed website data. NOT the pipeline import: "
            "groupPath titles, precise segmentKind, and review/reading state arrive when "
            "skepvox-book-pipeline sync-map + segment frontmatter are ingested. canonicalId is "
            "provisional and never a route href/slug; href/slug/displayTitle are presentation."
        ),
        "works": works,
        "segments": segments,
    }


def main() -> None:
    manifest = build()
    text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print("No segment-manifest changes.")
        return
    OUT.write_text(text, encoding="utf-8")
    chapter = sum(1 for s in manifest["segments"] if s["prefixCompatibility"] == "chapter-level")
    segment = sum(1 for s in manifest["segments"] if s["prefixCompatibility"] == "segment-level")
    single = sum(1 for s in manifest["segments"] if s["prefixCompatibility"] == "single-file")
    print(
        f"segment-manifest.json: {len(manifest['works'])} works, {len(manifest['segments'])} segments "
        f"({chapter} chapter-level, {segment} segment-level, {single} single-file)"
    )


if __name__ == "__main__":
    main()
