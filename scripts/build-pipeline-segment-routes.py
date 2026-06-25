#!/usr/bin/env python3
"""Generate the real pt segment route family for Introdução à ontologia at its PUBLIC namespace,
with each page carrying its REAL prose body as static Markdown.

Per docs/introduction-a-ontologia-live-migration-plan.md §4: the pipeline minted publicSlug /
urlStability:stable for the pt canonical edition (vendored into pipeline-export-segments.json). This
generates one page per pt segment under src/louis-lavelle/introducao-a-ontologia/<routePath-leaf>.md.

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
Redirects from the old fr chapter URLs are NOT enabled here (the redirect map stays not-enabled).
Deterministic + idempotent; routePath is presentation only, never an identity/join key.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pipeline_gate import route_visibility

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / ".vitepress" / "theme" / "data" / "pipeline-export-segments.json"
OUT_DIR = ROOT / "src" / "louis-lavelle" / "introducao-a-ontologia"
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


def page_text(rec: dict, prose_root: Path) -> str:
    vis = route_visibility(rec)
    description = f"Introdução à ontologia — Louis Lavelle. {rec['displayTitle']}."
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
        f"generated: {GENERATED_MARKER}",
        "---",
    ]
    prose = _read_prose(prose_root, rec)  # hard-fails if missing
    return "\n".join(fm) + "\n\n" + prose


def build(prose_root: Path) -> dict[str, str]:
    meta = json.loads(META.read_text(encoding="utf-8"))
    pt = sorted(
        (s for s in meta["segments"] if s["language"] == EDITION),
        key=lambda s: s["order"],
    )
    pages: dict[str, str] = {}
    for rec in pt:
        leaf = rec["routePath"].split("/")[-1]  # routePath = presentation; the filename only
        pages[f"{leaf}.md"] = page_text(rec, prose_root)
    return pages


def build_hub() -> str:
    """The pt work hub (index.md): a readable entry point — authored Part -> Chapter -> Segment LINKS
    into the pt route family, from pipeline-export metadata only (never segment-manifest). No prose
    body is concatenated; links use routePath (presentation = the public URL), not canonicalId.
    """
    meta = json.loads(META.read_text(encoding="utf-8"))
    pt = sorted(
        (s for s in meta["segments"] if s["language"] == EDITION),
        key=lambda s: s["order"],
    )
    description = "Introdução à ontologia de Louis Lavelle — edição em português, lida por trechos."
    fm = [
        "---",
        f"title: {json.dumps(WORK_HUB_TITLE, ensure_ascii=False)}",
        f"description: {json.dumps(description, ensure_ascii=False)}",
        "sidebar: false",
        "aside: false",
        "outline: false",
        f"generated: {WORK_HUB_MARKER}",
        "---",
    ]
    body = [
        "",
        f"# {WORK_HUB_TITLE}",
        "",
    ]

    # group Part -> Chapter -> Segment; loose (front matter / conclusion) get their own lists.
    groups: list[dict] = []
    group: dict | None = None
    chapter: dict | None = None
    for rec in pt:
        gp = rec["groupPath"]
        if not gp:
            # The trailing conclusion sentinel currently has no authored groupPath in the export.
            # Keep it visually continuous with the final chapter instead of creating a second loose
            # list under the same heading. Front matter still renders as the initial loose list.
            if chapter is not None and rec["segmentPrefix"].startswith("99-99-999"):
                chapter["segs"].append(rec)
                continue
            if not group or group["type"] != "loose":
                group = {"type": "loose", "segs": []}
                groups.append(group)
                chapter = None
            group["segs"].append(rec)
            continue
        part, chap = gp[0], gp[1]
        if not group or group["type"] != "part" or group["key"] != part["key"]:
            group = {"type": "part", "key": part["key"], "label": part["label"], "title": part["title"], "chapters": []}
            groups.append(group)
            chapter = None
        if not chapter or chapter["key"] != chap["key"]:
            chapter = {"key": chap["key"], "title": chap["title"] or chap["label"], "segs": []}
            group["chapters"].append(chapter)
        chapter["segs"].append(rec)

    def link(rec: dict) -> str:
        return f"- [{rec['displayTitle']}](/{rec['routePath']})"

    for grp in groups:
        if grp["type"] == "loose":
            body += [link(rec) for rec in grp["segs"]] + [""]
        else:
            head = grp["label"] + (f" — {grp['title']}" if grp["title"] else "")
            body += [f"## {head}", ""]
            for c in grp["chapters"]:
                body += [f"### {c['title']}", ""] + [link(rec) for rec in c["segs"]] + [""]

    return "\n".join(fm + body).rstrip() + "\n"


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

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = {p.name for p in OUT_DIR.glob("*.md")}
    changed = 0
    for name in sorted(existing - set(desired)):
        if f"generated: {GENERATED_MARKER}" in (OUT_DIR / name).read_text(encoding="utf-8"):
            (OUT_DIR / name).unlink()
            changed += 1
    for name, text in sorted(desired.items()):
        path = OUT_DIR / name
        if not path.exists() or path.read_text(encoding="utf-8") != text:
            path.write_text(text, encoding="utf-8")
            changed += 1

    # the pt work hub (index.md) — metadata-only links, regenerated alongside the leaves
    hub_path = OUT_DIR / "index.md"
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
