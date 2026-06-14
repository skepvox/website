#!/usr/bin/env python3

"""Build same-origin cue JSON for the on-page podcast player.

For one episode this reads the canonical transcript export
(``<repo>/system/exports/podcast-transcripts/<lang>-NNN/<lang>-NNN.transcript.json``)
plus the staged TTS source text, then emits a ``<episode-slug>.cues.json`` file
next to the website lesson page. The player imports that JSON at build time so
the transcript is server-rendered (readable with no JS) and the cue spans drive
audio-synced highlighting.

Paragraph grouping comes from the canonical TTS source (blank-line separated
paragraphs; for dialogue, one paragraph per speaker turn). Cues are mapped to
paragraphs by text alignment, never by raw source character offsets, because
speaker labels are stripped from the cue coordinate space. The mapping is
strict: every cue must align to exactly one paragraph or the build fails.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT.parent
SHOW_CONFIG_PATH = Path(__file__).resolve().with_name("podcast-show-config.json")
SHARED_SHOW_CONFIG = json.loads(SHOW_CONFIG_PATH.read_text(encoding="utf-8"))

MEDIA_BASE = "https://media.skepvox.com"

# Display titles per section slug, matching the existing lesson-page headings.
SECTION_TITLES: dict[str, dict[str, str]] = {
    "english": {
        "01-introduction": "Introduction",
        "02-dialogue-slow": "Dialogue - slow version",
        "03-explanation": "Explanation",
        "04-dialogue-natural": "Dialogue - natural speed",
        "05-conclusion": "Conclusion",
    },
    "francais": {
        "01-introduction": "Introduction",
        "02-dialogue-lent": "Dialogue - version lente",
        "03-explication": "Explication",
        "04-dialogue-naturel": "Dialogue - vitesse naturelle",
        "05-conclusion": "Conclusion",
    },
    "espanol": {
        "01-introduccion": "Introducción",
        "02-dialogo-lento": "Diálogo - versión lenta",
        "03-explicacion": "Explicación",
        "04-dialogo-natural": "Diálogo - velocidad natural",
        "05-conclusion": "Conclusión",
    },
}

# Default episodes built when the script is run with no arguments.
DEFAULT_EPISODES: tuple[tuple[str, int], ...] = (
    ("english", 1),
    ("francais", 1),
    ("espanol", 1),
)

FRONTMATTER_FIELD_RE = re.compile(r'^([A-Za-z0-9_-]+):\s*"?(.*?)"?\s*$')
# A dialogue speaker label: a short prefix ending in a colon at the start of a turn.
SPEAKER_LABEL_RE = re.compile(r"^\s*([^\n:]{1,40}?)\s*:\s+")


class BuildError(RuntimeError):
    """Raised when an episode cannot be built deterministically."""


def shared_show_value(show_key: str, field: str) -> str:
    show_config = SHARED_SHOW_CONFIG.get(show_key)
    if not isinstance(show_config, dict):
        raise BuildError(f"Missing shared show config for: {show_key}")
    value = show_config.get(field)
    if not isinstance(value, str) or not value:
        raise BuildError(f"Missing shared show config field {field!r} for: {show_key}")
    return value


def norm(text: str) -> str:
    """Collapse text to its comparable alphanumeric core (accent-preserving)."""
    return "".join(ch for ch in text.lower() if ch.isalnum())


def read_frontmatter_field(markdown: str, field: str) -> str | None:
    block = re.match(r"\A---\n(.*?)\n---", markdown, re.DOTALL)
    text = block.group(1) if block else markdown
    for line in text.splitlines():
        match = FRONTMATTER_FIELD_RE.match(line)
        if match and match.group(1) == field:
            return match.group(2)
    return None


def split_speaker(paragraph: str) -> tuple[str | None, str]:
    """Split a leading ``Name:`` speaker label off a dialogue paragraph."""
    match = SPEAKER_LABEL_RE.match(paragraph)
    if not match:
        return None, paragraph.strip()
    return match.group(1).strip(), paragraph[match.end():].strip()


def source_paragraphs(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]


def span(cue: dict, text: str) -> dict:
    """A highlightable span carrying a cue's id and timing."""
    return {"id": cue["id"], "start": cue["start"], "end": cue["end"], "text": text}


def map_section(
    slug: str,
    is_dialogue: bool,
    source_text: str,
    section_cues: list[dict],
) -> list[dict]:
    """Align a section's cues onto its canonical source paragraphs (strict).

    Each paragraph is one source block (for dialogue, one speaker turn). The
    section's cue text and paragraph text must be identical once normalized, or
    the build fails. Each cue is then assigned to exactly one paragraph — the one
    its first character falls in — so cue ids stay unique and none are dropped or
    duplicated. A cue that overruns a turn boundary keeps its full text under the
    turn where it begins.
    """
    bodies: list[tuple[str | None, str]] = []
    for index, para in enumerate(source_paragraphs(source_text)):
        speaker, body = split_speaker(para) if is_dialogue else (None, para)
        if not norm(body):
            raise BuildError(f"{slug}: empty paragraph {index} after normalization")
        bodies.append((speaker, body))

    para_concat = "".join(norm(body) for _, body in bodies)
    cue_concat = "".join(norm(cue["text"]) for cue in section_cues)
    if para_concat != cue_concat:
        diff = next(
            (i for i, (a, b) in enumerate(zip(para_concat, cue_concat)) if a != b),
            min(len(para_concat), len(cue_concat)),
        )
        raise BuildError(
            f"{slug}: source and cue text diverge "
            f"(source {len(para_concat)} vs cues {len(cue_concat)} chars).\n"
            f"  near source: {para_concat[diff:diff + 48]!r}\n"
            f"  near cues:   {cue_concat[diff:diff + 48]!r}"
        )

    ends: list[int] = []
    running = 0
    for _, body in bodies:
        running += len(norm(body))
        ends.append(running)

    paragraphs = [
        {"id": f"{slug}-p{n + 1:03d}", "speaker": speaker, "cues": []}
        for n, (speaker, _) in enumerate(bodies)
    ]
    position = 0
    current = 0
    crossings = 0
    for cue in section_cues:
        while current < len(ends) - 1 and position >= ends[current]:
            current += 1
        paragraphs[current]["cues"].append(span(cue, cue["text"]))
        length = len(norm(cue["text"]))
        if position + length > ends[current]:
            # cue text overruns the turn it starts in; it stays under that turn
            crossings += 1
        position += length
    return paragraphs, crossings


def build_episode(show: str, number: int) -> Path:
    repo = shared_show_value(show, "repo")
    website_subdir = shared_show_value(show, "website_subdir")
    repo_dir = PROJECTS / repo
    if not repo_dir.is_dir():
        raise BuildError(f"Source repo not found: {repo_dir}")

    episode_id = f"{show}-{number:03d}"
    transcript_path = (
        repo_dir
        / "system"
        / "exports"
        / "podcast-transcripts"
        / episode_id
        / f"{episode_id}.transcript.json"
    )
    if not transcript_path.is_file():
        raise BuildError(f"Transcript export not found: {transcript_path}")
    transcript = json.loads(transcript_path.read_text(encoding="utf-8"))

    lang = transcript["language"]
    cues = transcript["cues"]
    if not cues:
        raise BuildError(f"{episode_id}: transcript has no cues")

    # Canonical audio URL comes from the distribution episode (the feed source of
    # truth); cross-check it against the transcript's audio version.
    dist_matches = sorted(
        (repo_dir / "distribution" / "episodes").glob(f"{episode_id}-*.md")
    )
    if not dist_matches:
        raise BuildError(f"{episode_id}: no distribution episode file found")
    dist_md = dist_matches[0].read_text(encoding="utf-8")
    audio_url = read_frontmatter_field(dist_md, "public-audio-url")
    episode_slug = read_frontmatter_field(dist_md, "episode-slug")
    episode_title = read_frontmatter_field(dist_md, "episode-title")
    if not audio_url or not episode_slug or not episode_title:
        raise BuildError(
            f"{episode_id}: distribution file missing "
            f"public-audio-url/episode-slug/episode-title"
        )
    transcript_audio = Path(transcript["audio"]).name
    if Path(audio_url).name != transcript_audio:
        raise BuildError(
            f"{episode_id}: audio version mismatch — distribution {Path(audio_url).name!r} "
            f"vs transcript {transcript_audio!r}"
        )

    titles = SECTION_TITLES.get(show)
    if titles is None:
        raise BuildError(f"No section titles configured for show: {show}")

    # Group cues by their section, preserving order.
    cues_by_section: dict[str, list[dict]] = {}
    for cue in cues:
        cues_by_section.setdefault(cue["section"], []).append(cue)

    sections_out: list[dict] = []
    paragraph_count = 0
    crossing_count = 0
    mapped_ids: list[str] = []
    for section in transcript["source"]["sections"]:
        slug = section["slug"]
        label = titles.get(slug)
        if label is None:
            raise BuildError(f"{episode_id}: no display label for section {slug!r}")
        source_file = repo_dir / section["file"]
        if not source_file.is_file():
            raise BuildError(f"{episode_id}: source text not found: {source_file}")
        section_cues = cues_by_section.get(slug, [])
        paragraphs, crossings = map_section(
            slug,
            bool(section["is_dialogue"]),
            source_file.read_text(encoding="utf-8"),
            section_cues,
        )
        paragraph_count += len(paragraphs)
        crossing_count += crossings
        for para in paragraphs:
            mapped_ids.extend(c["id"] for c in para["cues"])
        sections_out.append(
            {
                "id": slug,
                "label": label,
                "isDialogue": bool(section["is_dialogue"]),
                "paragraphs": paragraphs,
            }
        )

    # Validation: every cue mapped exactly once, in order, no id duplicated.
    all_ids = [c["id"] for c in cues]
    unmapped = len(all_ids) - len(mapped_ids)
    duplicates = len(mapped_ids) - len(set(mapped_ids))
    if mapped_ids != all_ids:
        raise BuildError(
            f"{episode_id}: cue mapping is not a 1:1 in-order cover "
            f"(mapped {len(mapped_ids)} vs {len(all_ids)} cues, "
            f"unmapped={unmapped}, duplicates={duplicates})"
        )

    payload = {
        "episode": {
            "id": episode_id,
            "title": episode_title,
            "audioUrl": audio_url,
            "lang": lang,
            "durationSeconds": transcript.get("duration_seconds"),
        },
        "sections": sections_out,
    }

    out_path = ROOT / "src" / "podcast" / website_subdir / f"{episode_slug}.cues.json"
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(
        f"OK   {episode_id} -> {out_path.relative_to(ROOT)}\n"
        f"       cues read={len(all_ids)} emitted={len(mapped_ids)} "
        f"sections={len(sections_out)} paragraphs={paragraph_count} "
        f"unmapped={unmapped} duplicate-ids={duplicates} "
        f"boundary-crossing-cues={crossing_count}"
    )
    return out_path


def parse_args(argv: list[str]) -> list[tuple[str, int]]:
    if not argv:
        return list(DEFAULT_EPISODES)
    if len(argv) % 2 != 0:
        raise SystemExit("Usage: build-episode-cues.py [<show> <episode-number> ...]")
    episodes: list[tuple[str, int]] = []
    for i in range(0, len(argv), 2):
        episodes.append((argv[i], int(argv[i + 1])))
    return episodes


def main(argv: list[str]) -> int:
    failures = 0
    for show, number in parse_args(argv):
        try:
            build_episode(show, number)
        except BuildError as error:
            failures += 1
            print(f"FAIL {show}-{number:03d}: {error}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
