#!/usr/bin/env python3
"""Generate the real pt segment route family for Introdução à ontologia at its PUBLIC namespace,
with each page carrying its REAL prose body as static Markdown.

Per docs/introduction-a-ontologia-live-migration-plan.md §4: the pipeline minted publicSlug /
urlStability:stable for the pt canonical edition (vendored into pipeline-export-segments.json). This
generates one page per pt segment under <OUT_DIR>/<routePath-leaf>.md, where OUT_DIR is DERIVED from
the (website-projected) routePath prefix — not a hard-code (slice A1 / IA-1, scripts/route_base.py).
build-pipeline-export.py already applied ROUTE_BASE, so a base flip relocates this whole tree with no
edit here; as of slice A2 / IA-2 the prefix is src/pt/filosofia/louis-lavelle/introducao-a-ontologia/
and the leaf is the bare segmentPrefix (LEAF_POLICY = "prefix-only").

Prose is JOINED from the book-pipeline export/prose tree by (segmentPrefix, language) — never by
routePath — and INLINED directly into each page body as static Markdown (no per-route JSON bundle, no
client component). The prose leaves are already body-only sanitized in the pipeline; we re-assert no
personal markers and inline them verbatim, matching the house reading-page style (a `##` heading then
the prose, frontmatter `title` drives the document <title>).

Visibility comes from the stability-aware gate (scripts/pipeline_gate.py): stable+publicSlug ->
INDEXABLE (no buffer/search:false/noindex); draft/provisional -> hidden. Today all 99 pt are stable,
so all 99 are indexable public reading pages. A stable page with NO prose source is a HARD FAILURE
(no fallback notice). If the sibling export/prose tree is entirely absent (a clean website checkout /
CI without the sibling repo), the generator no-ops and keeps the committed pages.

These pages are kept OUT of the legacy hand-authored reading system: they carry a
`generated: pipeline-segment-routes` marker that build-reading-nav.py skips, and they are in no
works.json registry, so reading-nav / sidebar / segment-manifest / WorkContents are untouched.
No redirects: slice A4 removed the old fr->pt redirect map and src/public/_redirects (clean-break
policy — old /louis-lavelle/... URLs may 404). Deterministic + idempotent; routePath is presentation
only, never an identity/join key.
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
WORK_HUB_TITLE = "Introdução à ontologia"
PERSONAL_MARKERS = ("read-at", "==", "%% review", "[!review]", "[!dt]")


def _read_prose(prose_root: Path, rec: dict) -> str:
    """Sanitized prose body for a segment, joined by (segmentPrefix, language) — never routePath.

    Raises FileNotFoundError if the leaf is missing (a stable public page must never be thin) and
    ValueError if a personal marker leaks.
    """
    author, book = rec["workId"].split("/", 1)
    path = prose_root / author / book / rec["language"] / f"{rec['segmentPrefix']}.md"
    if not path.exists():
        raise FileNotFoundError(
            f"missing prose for {rec['canonicalId']} ({rec['language']}): {path} — a stable public "
            f"page may not be generated without its prose body"
        )
    body = path.read_text(encoding="utf-8")
    leaked = [m for m in PERSONAL_MARKERS if m in body.lower()]
    if leaked:
        raise ValueError(f"prose leaf {path} carries personal markers: {leaked}")
    return body.strip("\n") + "\n"


def _split_leading_headings(prose: str) -> tuple[str | None, str | None, str]:
    """Lift the LEADING structural headings the vendored prose carries — `## chapter` then an
    optional `### segment` — out of the body, so the owned PipelineReaderHeader can render them as
    real <h2>/<h3> chrome instead of the rented vt-doc chapter-opener event (Slice B). Only the
    leading headings are removed; any heading deeper in the prose is left as body content. The
    remaining prose is preserved verbatim. Returns (chapter, segment_title, body).
    """
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


def page_text(rec: dict, prose_root: Path) -> str:
    vis = route_visibility(rec)
    description = f"Introdução à ontologia — Louis Lavelle. {rec['displayTitle']}."
    prose = _read_prose(prose_root, rec)  # hard-fails if missing
    # Lift the leading chapter/segment headings out of the body → owned reader-header (Slice B). They
    # stay REAL <h2>/<h3> (PipelineReaderHeader renders them from these frontmatter fields), so the
    # document outline + SEO are preserved; the prose body simply no longer restarts with a heading.
    chapter, segment_title, body = _split_leading_headings(prose)
    fm = [
        "---",
        f"title: {json.dumps(rec['displayTitle'], ensure_ascii=False)}",
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
    if chapter is not None:
        fm.append(f"pipelineChapter: {json.dumps(chapter, ensure_ascii=False)}")
    if segment_title is not None:
        fm.append(f"pipelineSegmentTitle: {json.dumps(segment_title, ensure_ascii=False)}")
    fm += [
        f"generated: {GENERATED_MARKER}",
        "---",
    ]
    return "\n".join(fm) + "\n\n" + body


def build(prose_root: Path) -> dict[str, str]:
    meta = json.loads(META.read_text(encoding="utf-8"))
    pt = sorted(
        (s for s in meta["segments"] if s["language"] == EDITION),
        key=lambda s: s["order"],
    )
    pages: dict[str, str] = {}
    for rec in pt:
        # The filename follows whatever leaf build-pipeline-export.py already projected (LEAF_POLICY is
        # owned there, scripts/route_base.py) — this generator is leaf-policy-agnostic. Today that leaf
        # is "<segmentPrefix>-<publicSlug>"; after the A2 prefix-only flip it is the bare segmentPrefix.
        leaf = rec["routePath"].split("/")[-1]  # routePath = presentation; the filename only
        pages[f"{leaf}.md"] = page_text(rec, prose_root)
    return pages


def resolve_out_dir() -> Path:
    """Derive the generated-page directory from the (website-projected) routePath prefix in the
    pipeline export — never a hard-code. build-pipeline-export.py already applied ROUTE_BASE
    (scripts/route_base.py), so a single base flip relocates this whole tree with no edit here. All
    pt segments share one work prefix; routePath is presentation only, never identity."""
    meta = json.loads(META.read_text(encoding="utf-8"))
    dirs = {segment_dir_parts(s["routePath"]) for s in meta["segments"] if s["language"] == EDITION}
    if len(dirs) != 1:
        raise ValueError(f"pt segments span multiple route prefixes: {sorted(dirs)}")
    return ROOT.joinpath("src", *next(iter(dirs)))


def build_hub() -> str:
    """The pt work hub (index.md): a minimal entry point — frontmatter only.

    The title and contents map (front matter, then Part -> Chapter -> Segment) are rendered by the
    owned SSR component PipelineWorkContents (.vitepress/theme/components), which reads the SAME
    pipeline-export metadata and builds the hierarchy from each segment's groupPath. No prose and no
    markdown link list are emitted here, so the hub carries no bullet-list contents dependency and
    `footer: false` retires the rented prev/next pager (matching every other non-leaf route).
    """
    description = "Introdução à ontologia de Louis Lavelle — edição em português, lida por trechos."
    fm = [
        "---",
        f"title: {json.dumps(WORK_HUB_TITLE, ensure_ascii=False)}",
        f"description: {json.dumps(description, ensure_ascii=False)}",
        "sidebar: false",
        "aside: false",
        "footer: false",
        "outline: false",
        f"generated: {WORK_HUB_MARKER}",
        "---",
    ]
    return "\n".join(fm).rstrip() + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate the pt public segment route family.")
    parser.add_argument("--prose-root", type=Path, default=PROSE_ROOT_DEFAULT)
    parser.add_argument(
        "--dry-run", action="store_true", help="validate prose join + would-write; write nothing"
    )
    args = parser.parse_args(argv)

    if not args.prose_root.exists():
        # sibling export/prose absent (clean website checkout) -> keep the committed pages as-is
        print("segment-routes: prose source absent; keeping committed pages.")
        return 0

    try:
        desired = build(args.prose_root)
    except (FileNotFoundError, ValueError) as exc:
        print(f"segment-routes ERROR: {exc}", file=sys.stderr)
        return 1

    if args.dry_run:
        print(f"segment-routes (dry-run): {len(desired)} pt pages OK — prose joined for all.")
        return 0

    out_dir = resolve_out_dir()  # derived from the projected routePath prefix, never hard-coded
    out_dir.mkdir(parents=True, exist_ok=True)
    existing = {p.name for p in out_dir.glob("*.md")}
    changed = 0
    for name in sorted(existing - set(desired)):
        if f"generated: {GENERATED_MARKER}" in (out_dir / name).read_text(encoding="utf-8"):
            (out_dir / name).unlink()
            changed += 1
    for name, text in sorted(desired.items()):
        path = out_dir / name
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8")
            changed += 1

    # the pt work hub (index.md) — metadata-only links, regenerated alongside the leaves
    hub_path = out_dir / "index.md"
    hub_text = build_hub()
    if not hub_path.exists() or hub_path.read_text(encoding="utf-8") != hub_text:
        hub_path.write_text(hub_text, encoding="utf-8")
        changed += 1

    print(
        "No segment-routes changes."
        if changed == 0
        else f"segment-routes: {len(desired)} pt pages + hub ({changed} changed)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
