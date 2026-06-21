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

from _podcast_player_wiring import COMPONENT_TAG, HEADER_BLOCK_RE


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DIST = ROOT / ".vitepress" / "dist"
LLMS_FULL = DIST / "llms-full.txt"
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


# Human-readable episode-context labels for LLM outputs, by show language.
LLM_LABELS = {
    "fr": ("Série", "Épisode", "Point principal", "Durée"),
    "es": ("Serie", "Episodio", "Punto principal", "Duración"),
    "en": ("Series", "Episode", "Main point", "Duration"),
}


def header_markdown(episode: dict, lede: str) -> str:
    """Plain-Markdown episode context for LLM outputs, built from the cue JSON and
    the header slot text (the learning point). No component tag, no raw URL."""
    series_label, episode_label, point_label, duration_label = LLM_LABELS.get(
        episode.get("lang", "en"), LLM_LABELS["en"]
    )
    number = (episode.get("id", "").rsplit("-", 1)[-1] or "").zfill(3)
    seconds = episode.get("durationSeconds") or 0
    lines = [
        f"# {episode.get('title', '')}",
        f"{series_label}: {episode.get('showTitle', '')}",
        f"{episode_label}: {number}",
        f"{point_label}: {lede}",
    ]
    if seconds > 0:
        lines.append(f"{duration_label}: {round(seconds / 60)} min")
    return "\n".join(lines)


def replace_header_after_import(text: str, cue_filename: str, episode: dict) -> str:
    """Swap the <PodcastEpisodeHeader> block (located by tag, slot read as plain
    text) for a Markdown context block; no-op if already expanded/absent."""
    import_match = re.search(
        rf"import\s+cues\s+from\s+['\"]\./{re.escape(cue_filename)}['\"]",
        text,
    )
    if not import_match:
        return text
    match = HEADER_BLOCK_RE.search(text, import_match.end())
    if not match:
        return text
    block = header_markdown(episode, match.group("lede").strip())
    return text[: match.start()] + block + text[match.end() :]


def patch_file(path: Path, cue_filename: str, rendered: str, episode: dict) -> None:
    original = path.read_text(encoding="utf-8")
    updated = replace_component_after_import(original, cue_filename, rendered, path)
    updated = replace_header_after_import(updated, cue_filename, episode)
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

        episode = json.loads(cue_json.read_text(encoding="utf-8")).get("episode", {})
        patch_file(dist_page, cue_json.name, rendered, episode)
        llms_text = replace_component_after_import(llms_text, cue_json.name, rendered, LLMS_FULL)
        llms_text = replace_header_after_import(llms_text, cue_json.name, episode)
        patched += 1
        print(f"OK   {page.relative_to(SRC)} -> rendered {cue_json.name} for LLM outputs")

    LLMS_FULL.write_text(llms_text, encoding="utf-8")
    print(f"Rendered PodcastPlayer transcripts for {patched} LLM output pages")


if __name__ == "__main__":
    main()
