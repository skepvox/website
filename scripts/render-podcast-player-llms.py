#!/usr/bin/env python3
"""Expand PodcastPlayer transcript data in VitePress LLM outputs.

The visible podcast pages render the transcript through PodcastPlayer.vue from
cue JSON. The llms plugin copies Markdown sources, so it would otherwise leave a
component tag where the transcript should be. This post-build step replaces that
tag in dist Markdown/llms-full outputs with plain Markdown rendered from the
same cue JSON.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DIST = ROOT / ".vitepress" / "dist"
LLMS_FULL = DIST / "llms-full.txt"
COMPONENT_TAG = '<PodcastPlayer :episode="cues.episode" :sections="cues.sections" />'
RENDER_MARKER = "<!-- Rendered for LLM outputs from synced cue JSON. -->"
CUES_IMPORT_RE = re.compile(r"import\s+cues\s+from\s+['\"]\.\/([^'\"]+\.cues\.json)['\"]")


class RenderError(RuntimeError):
    pass


def paragraph_text(paragraph: dict) -> str:
    return "".join(f"{cue['text']}{cue.get('sep', '')}" for cue in paragraph["cues"]).strip()


def render_transcript(cue_json: Path) -> str:
    data = json.loads(cue_json.read_text(encoding="utf-8"))
    lines = [
        RENDER_MARKER,
        "",
    ]

    paragraph_count = 0
    cue_count = 0
    for section in data["sections"]:
        lines.extend([f"### {section['label']}", ""])
        for paragraph in section["paragraphs"]:
            text = paragraph_text(paragraph)
            if not text:
                continue
            speaker = paragraph.get("speaker")
            if speaker:
                lines.extend([f"**{speaker}:** {text}", ""])
            else:
                lines.extend([text, ""])
            paragraph_count += 1
            cue_count += len(paragraph["cues"])

    if paragraph_count == 0 or cue_count == 0:
        raise RenderError(f"{cue_json}: no transcript content rendered")
    return "\n".join(lines).rstrip()


def replace_component_after_import(text: str, cue_filename: str, rendered: str, target: Path) -> str:
    import_match = re.search(
        rf"import\s+cues\s+from\s+['\"]\.\/{re.escape(cue_filename)}['\"]",
        text,
    )
    if not import_match:
        raise RenderError(f"{target}: missing cues import for {cue_filename}")

    tag_index = text.find(COMPONENT_TAG, import_match.end())
    if tag_index < 0:
        marker_index = text.find(RENDER_MARKER, import_match.end())
        if marker_index >= 0:
            return text
        raise RenderError(f"{target}: missing PodcastPlayer tag after {cue_filename}")

    return text[:tag_index] + rendered + text[tag_index + len(COMPONENT_TAG) :]


def patch_file(path: Path, cue_filename: str, rendered: str) -> None:
    original = path.read_text(encoding="utf-8")
    updated = replace_component_after_import(original, cue_filename, rendered, path)
    path.write_text(updated, encoding="utf-8")


def source_pages() -> list[tuple[Path, Path]]:
    pages: list[tuple[Path, Path]] = []
    for page in sorted((SRC / "podcast").glob("*/*.md")):
        text = page.read_text(encoding="utf-8")
        match = CUES_IMPORT_RE.search(text)
        if not match or COMPONENT_TAG not in text:
            continue
        cue_json = page.with_name(match.group(1))
        if not cue_json.exists():
            raise RenderError(f"{page}: cue JSON not found: {cue_json.name}")
        pages.append((page, cue_json))
    return pages


def main() -> None:
    if not DIST.exists() or not LLMS_FULL.exists():
        raise RenderError("dist outputs are missing; run vitepress build first")

    pages = source_pages()
    if not pages:
        raise RenderError("no PodcastPlayer pages found")

    llms_text = LLMS_FULL.read_text(encoding="utf-8")
    patched = 0
    for page, cue_json in pages:
        rendered = render_transcript(cue_json)
        dist_page = DIST / page.relative_to(SRC)
        if not dist_page.exists():
            raise RenderError(f"dist page not found: {dist_page}")

        patch_file(dist_page, cue_json.name, rendered)
        llms_text = replace_component_after_import(llms_text, cue_json.name, rendered, LLMS_FULL)
        patched += 1
        print(f"OK   {page.relative_to(SRC)} -> rendered {cue_json.name} for LLM outputs")

    LLMS_FULL.write_text(llms_text, encoding="utf-8")
    print(f"Rendered PodcastPlayer transcripts for {patched} LLM output pages")


if __name__ == "__main__":
    main()
