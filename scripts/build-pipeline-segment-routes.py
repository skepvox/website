#!/usr/bin/env python3
"""Generate the real pt segment route family for every vendored pipeline-export work, each page
carrying its REAL prose body as static Markdown.

Multi-work (slice B2): iterates `pipeline-export-segments.json`'s `works` and, per work, generates one
page per published-edition (pt) segment under <OUT_DIR>/<routePath-leaf>.md, where OUT_DIR is DERIVED
from the (website-projected) routePath prefix (slice A1 / IA-1, scripts/route_base.py) — not a hard-code.
build-pipeline-export.py already applied ROUTE_BASE per workId, so a base flip relocates a work's whole
tree with no edit here. As of B2 the works are louis-lavelle/introduction-a-ontologia (pt, stable, A2)
and machado-de-assis/bras-cubas (pt, draft -> generated but hidden), the latter at
src/pt/literatura/machado-de-assis/bras-cubas/ with bare-segmentPrefix leaves (LEAF_POLICY=prefix-only).

Prose is JOINED from the book-pipeline export/prose tree by (workId, language, segmentPrefix) — never by
routePath — and INLINED into each page body as static Markdown. The prose leaves are already body-only
sanitized in the pipeline; we re-assert no personal markers, STRIP the leading `##`/`###` headings (they
are presentation context the website renders from metadata, never trusted as the title), and inline the
remaining prose verbatim. The reader header/title come from the export METADATA (displayTitle / groupPath),
not the body heading — so a legacy/dirty leading heading (e.g. bras-cubas `## 001 — Óbito do Autor`) is
discarded, and a punctuation-only authored title (ch 53 `.......`) is shown faithfully. A per-work config
declares whether a work's authored headings are clean enough to mirror into the frontmatter fallback.

Visibility comes from the stability-aware gate (scripts/pipeline_gate.py): stable+publicSlug -> INDEXABLE;
draft/provisional -> generated but HIDDEN (buffer + noindex, out of sitemap/search/LLM). Lavelle pt is
stable (indexable); bras-cubas pt is draft with no publicSlug -> hidden (publication is a later, separate
book-pipeline act — this slice never mints publicSlug or fakes stability). A page with NO prose source is
a HARD FAILURE. If the sibling export/prose tree is entirely absent (clean checkout / CI), the generator
no-ops and keeps the committed pages.

These pages stay OUT of the legacy hand-authored reading system (they carry a `generated:
pipeline-segment-routes` marker that build-reading-nav.py skips and config.ts's marker-aware sitemap
pruning recognizes at any path) and are in no works.json registry. No redirects (clean-break). Deterministic
+ idempotent; routePath is presentation only, never an identity/join key.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pipeline_gate import route_visibility
from route_base import segment_dir_parts

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / ".vitepress" / "theme" / "data" / "pipeline-export-segments.json"
PROSE_ROOT_DEFAULT = ROOT.parent / "skepvox-book-pipeline" / "export" / "prose"
EDITION = "pt"
GENERATED_MARKER = "pipeline-segment-routes"
WORK_HUB_MARKER = "pipeline-work-hub"
PERSONAL_MARKERS = ("read-at", "==", "%% review", "[!review]", "[!dt]")

# Per-work reader config (the small ingest allowlist). `unit` is the reading-granularity word for the
# hub blurb; `lift_headings` mirrors a work's CLEAN authored leading `##`/`###` headings into the
# pipelineChapter/pipelineSegmentTitle frontmatter fallback. Brás Cubas's leading `##` is a legacy/dirty
# chapter heading (the reader header uses the export metadata instead), so it is stripped but NOT mirrored.
WORK_CONFIG: dict[str, dict] = {
    "louis-lavelle/introduction-a-l-ontologie": {"unit": "trechos", "lift_headings": True},
    "machado-de-assis/bras-cubas": {"unit": "capítulos", "lift_headings": False},
}


def _meta() -> dict:
    return json.loads(META.read_text(encoding="utf-8"))


def _read_prose(prose_root: Path, rec: dict) -> str:
    """Sanitized prose body for a segment, joined by (workId, language, segmentPrefix) — never routePath.

    Raises FileNotFoundError if the leaf is missing (a generated page must never be thin) and ValueError
    if a personal marker leaks.
    """
    author, book = rec["workId"].split("/", 1)
    path = prose_root / author / book / rec["language"] / f"{rec['segmentPrefix']}.md"
    if not path.exists():
        raise FileNotFoundError(
            f"missing prose for {rec['canonicalId']} ({rec['language']}): {path} — a generated page "
            f"may not be written without its prose body"
        )
    body = path.read_text(encoding="utf-8")
    leaked = [m for m in PERSONAL_MARKERS if m in body.lower()]
    if leaked:
        raise ValueError(f"prose leaf {path} carries personal markers: {leaked}")
    return body.strip("\n") + "\n"


def _split_leading_headings(prose: str) -> tuple[str | None, str | None, str]:
    """Lift the LEADING structural headings the vendored prose carries — `## chapter` then an optional
    `### segment` — out of the body, so they are rendered as reader chrome (from METADATA) instead of
    restarting the body with a heading. Only the leading headings are removed; deeper headings stay body
    content. Returns (chapter, segment_title, body)."""
    lines = prose.split("\n")

    def skip_blank(j: int) -> int:
        while j < len(lines) and lines[j].strip() == "":
            j += 1
        return j

    chapter: str | None = None
    segment_title: str | None = None
    i = skip_blank(0)
    if i < len(lines) and lines[i].startswith("## "):
        chapter = lines[i][3:].strip()
        i = skip_blank(i + 1)
        if i < len(lines) and lines[i].startswith("### "):
            segment_title = lines[i][4:].strip()
            i = skip_blank(i + 1)
    return chapter, segment_title, "\n".join(lines[i:])


def _fallback_title(rec: dict) -> str:
    """A calm title for a segment whose authored displayTitle is empty — based on the chapter number /
    prefix, never the body. Identity (canonicalId/segmentPrefix) is unchanged. (Dormant for the current
    corpus: every bras-cubas segment carries an authored title, incl. ch 53's dotted marker.)"""
    chapter = next((lvl for lvl in rec["groupPath"] if lvl["kind"] == "chapter"), None)
    if chapter is not None:
        return f"Capítulo {chapter['index']}"
    return rec["segmentPrefix"]


def page_text(rec: dict, prose_root: Path, work: dict, cfg: dict) -> str:
    vis = route_visibility(rec)
    title = (rec["displayTitle"] or "").strip() or _fallback_title(rec)
    description = f"{work['title']} — {work['author']}. {title}."
    prose = _read_prose(prose_root, rec)  # hard-fails if missing
    chapter, segment_title, body = _split_leading_headings(prose)  # always strip leading headings
    fm = [
        "---",
        f"title: {json.dumps(title, ensure_ascii=False)}",
        f"description: {json.dumps(description, ensure_ascii=False)}",
        "sidebar: false",
        "aside: false",
        "footer: false",
        "outline: false",
    ]
    if vis["buffer"]:
        fm.append("buffer: true")
    if not vis["search"]:
        fm.append("search: false")
    if vis["noindex"]:
        fm += ["head:", "  - ['meta', { name: 'robots', content: 'noindex' }]"]
    fm += [
        f"pipelineCanonicalId: {json.dumps(rec['canonicalId'])}",
        f"pipelineLanguage: {EDITION}",
        f"pipelineSegment: {json.dumps(rec['segmentPrefix'])}",
    ]
    # Mirror only CLEAN authored headings into the frontmatter fallback; the reader header otherwise
    # reads chapter/segment from the export metadata (groupPath / displayTitle).
    if cfg["lift_headings"]:
        if chapter is not None:
            fm.append(f"pipelineChapter: {json.dumps(chapter, ensure_ascii=False)}")
        if segment_title is not None:
            fm.append(f"pipelineSegmentTitle: {json.dumps(segment_title, ensure_ascii=False)}")
    fm += [f"generated: {GENERATED_MARKER}", "---"]
    return "\n".join(fm) + "\n\n" + body


def _published_segments(meta: dict, work_id: str) -> list[dict]:
    return sorted(
        (s for s in meta["segments"] if s["workId"] == work_id and s["language"] == EDITION),
        key=lambda s: s["order"],
    )


def build_work(meta: dict, work: dict, prose_root: Path) -> dict[str, str]:
    """{leaf-filename: page_text} for one work's published-edition segments."""
    cfg = WORK_CONFIG[work["workId"]]
    pages: dict[str, str] = {}
    for rec in _published_segments(meta, work["workId"]):
        leaf = rec["routePath"].split("/")[-1]  # routePath = presentation; the filename only
        pages[f"{leaf}.md"] = page_text(rec, prose_root, work, cfg)
    return pages


def resolve_out_dir(meta: dict, work_id: str) -> Path:
    """The generated-page directory for a work, derived from its (projected) routePath prefix — never a
    hard-code. All of a work's published segments share one work prefix."""
    dirs = {segment_dir_parts(s["routePath"]) for s in _published_segments(meta, work_id)}
    if len(dirs) != 1:
        raise ValueError(f"{work_id} pt segments span multiple route prefixes: {sorted(dirs)}")
    return ROOT.joinpath("src", *next(iter(dirs)))


def build_hub(meta: dict, work: dict) -> str:
    """The work hub (index.md): frontmatter only. PipelineWorkContentsMount reads pipelineWorkId /
    pipelineLanguage and mounts the owned SSR PipelineWorkContents, which builds the contents from the
    SAME pipeline-export metadata. No prose, no markdown link list. The hub inherits its work's segment
    visibility — a draft/hidden work (bras-cubas) gets a hidden hub; a published work (Lavelle) keeps an
    indexable hub."""
    cfg = WORK_CONFIG[work["workId"]]
    description = f"{work['title']} de {work['author']} — edição em português, lida por {cfg['unit']}."
    segs = _published_segments(meta, work["workId"])
    vis = route_visibility(segs[0]) if segs else {"buffer": False, "search": True, "noindex": False}
    fm = [
        "---",
        f"title: {json.dumps(work['title'], ensure_ascii=False)}",
        f"description: {json.dumps(description, ensure_ascii=False)}",
        "sidebar: false",
        "aside: false",
        "footer: false",
        "outline: false",
    ]
    if vis["buffer"]:
        fm.append("buffer: true")
    if not vis["search"]:
        fm.append("search: false")
    if vis["noindex"]:
        fm += ["head:", "  - ['meta', { name: 'robots', content: 'noindex' }]"]
    fm += [
        f"pipelineWorkId: {json.dumps(work['workId'])}",
        f"pipelineLanguage: {EDITION}",
        f"generated: {WORK_HUB_MARKER}",
        "---",
    ]
    return "\n".join(fm).rstrip() + "\n"


def _write_work(out_dir: Path, pages: dict[str, str], hub_text: str) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    changed = 0
    existing = {p.name for p in out_dir.glob("*.md")}
    for name in sorted(existing - set(pages) - {"index.md"}):
        if f"generated: {GENERATED_MARKER}" in (out_dir / name).read_text(encoding="utf-8"):
            (out_dir / name).unlink()
            changed += 1
    for name, text in sorted(pages.items()):
        path = out_dir / name
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8")
            changed += 1
    hub_path = out_dir / "index.md"
    if not hub_path.exists() or hub_path.read_text(encoding="utf-8") != hub_text:
        hub_path.write_text(hub_text, encoding="utf-8")
        changed += 1
    return changed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate the pt public segment route families.")
    parser.add_argument("--prose-root", type=Path, default=PROSE_ROOT_DEFAULT)
    parser.add_argument(
        "--dry-run", action="store_true", help="validate prose join + would-write; write nothing"
    )
    args = parser.parse_args(argv)

    if not args.prose_root.exists():
        print("segment-routes: prose source absent; keeping committed pages.")
        return 0

    meta = _meta()
    works = [w for w in meta["works"] if w["workId"] in WORK_CONFIG]
    try:
        built = {w["workId"]: build_work(meta, w, args.prose_root) for w in works}
    except (FileNotFoundError, ValueError) as exc:
        print(f"segment-routes ERROR: {exc}", file=sys.stderr)
        return 1

    if args.dry_run:
        total = sum(len(p) for p in built.values())
        print(f"segment-routes (dry-run): {total} pt pages OK across {len(works)} works — prose joined.")
        return 0

    total_changed = 0
    for work in works:
        out_dir = resolve_out_dir(meta, work["workId"])
        total_changed += _write_work(out_dir, built[work["workId"]], build_hub(meta, work))

    counts = ", ".join(f"{w['workId'].split('/')[-1]}={len(built[w['workId']])}" for w in works)
    print(
        "No segment-routes changes."
        if total_changed == 0
        else f"segment-routes: {len(works)} works ({counts}) — {total_changed} files changed"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
