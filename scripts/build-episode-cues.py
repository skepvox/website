#!/usr/bin/env python3

"""Build same-origin cue JSON for the on-page podcast player.

For one episode this reads the canonical transcript export
(``<repo>/system/exports/podcast-transcripts/<lang>-NNN/<lang>-NNN.transcript.json``)
plus the staged TTS source text, then emits a ``<episode-slug>.cues.json`` file
next to the website lesson page. The player imports that JSON at build time so
the transcript is server-rendered (readable with no JS) and the cue spans drive
audio-synced highlighting.

Cue timing/ids/section come straight from transcript.json. Cue *display text* is
re-derived from the canonical stripped source: transcript.json's cue text equals
``canonical[source_char_range]`` but consecutive ranges do NOT tile — sentence
punctuation that falls between cues (final periods, quotes, guillemets, …) lives
in the gaps and is absent from every cue. We restore it by deterministic gap
attachment: for each gap between cue_i and cue_{i+1}, split at the last
whitespace run; non-space chars before it close cue_i, non-space chars after it
open cue_{i+1}; pure-whitespace cross-paragraph gaps stay paragraph breaks. Any
alphanumeric content in a gap is a hard error. Speaker labels stay non-timed
paragraph labels and never enter timed cue text.

NOTE: the same boundary-punctuation loss exists upstream in transcript.json and
the published .vtt; this script only fixes the website copy. The transcript/VTT
generator should be fixed separately.
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

# Punctuation tracked for the before/after loss report.
PUNCT_MARKS = [
    ".", ",", ";", ":", "!", "?", "…", "«", "»",
    '"', "“", "”", "'", "’", "¿", "¡", "(", ")",
]

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


def read_frontmatter_field(markdown: str, field: str) -> str | None:
    block = re.match(r"\A---\n(.*?)\n---", markdown, re.DOTALL)
    text = block.group(1) if block else markdown
    for line in text.splitlines():
        match = FRONTMATTER_FIELD_RE.match(line)
        if match and match.group(1) == field:
            return match.group(2)
    return None


def split_speaker(paragraph: str) -> tuple[str | None, str]:
    match = SPEAKER_LABEL_RE.match(paragraph)
    if not match:
        return None, paragraph.strip()
    return match.group(1).strip(), paragraph[match.end():].strip()


def reconstruct_canonical(repo_dir: Path, section: dict) -> str:
    """Rebuild the stripped source coordinate space transcript.json indexes.

    Non-dialogue: the source file with trailing whitespace removed. Dialogue: the
    same with line-initial ``Speaker:`` labels removed (labels are non-timed).
    """
    raw = (repo_dir / section["file"]).read_text(encoding="utf-8")
    if section["is_dialogue"]:
        raw = re.sub(r"(?m)^[^\n:]{1,40}?:\s+", "", raw)
    return raw.rstrip()


def non_space(text: str) -> str:
    return "".join(ch for ch in text if not ch.isspace())


def map_section(
    section: dict,
    repo_dir: Path,
    section_cues: list[dict],
    label: str,
    stats: dict[str, int],
) -> tuple[dict, int, str]:
    """Group cues into paragraphs and restore gap punctuation (strict)."""
    slug = section["slug"]
    is_dialogue = bool(section["is_dialogue"])
    off = section["start_char"]
    canon = reconstruct_canonical(repo_dir, section)
    if len(canon) != section["chars"]:
        raise BuildError(
            f"{slug}: canonical length {len(canon)} != chars {section['chars']}"
        )
    # Confirm we are in the coordinate space transcript.json used. Compare on
    # non-whitespace content: a cue that spans a paragraph collapses the source
    # "\n\n" to a single space in transcript.json, but its punctuation/letters
    # must match the canonical slice exactly.
    for cue in section_cues:
        a, b = cue["source_char_range"]
        if non_space(canon[a - off : b - off]) != non_space(cue["text"]):
            raise BuildError(f"{slug}: cue {cue['id']} text != canonical slice")

    raw = (repo_dir / section["file"]).read_text(encoding="utf-8")
    raw_paras = [p for p in re.split(r"\n\s*\n", raw.strip()) if p.strip()]
    speakers = [split_speaker(p)[0] if is_dialogue else None for p in raw_paras]
    para_spans = [(m.start(), m.end()) for m in re.finditer(r"[^\n]+", canon)]
    if len(para_spans) != len(speakers):
        raise BuildError(
            f"{slug}: paragraph count mismatch ({len(para_spans)} vs {len(speakers)})"
        )

    def para_index(local_start: int) -> int:
        for j, (start, end) in enumerate(para_spans):
            if start <= local_start < end:
                return j
        raise BuildError(f"{slug}: cue start {local_start} falls outside a paragraph")

    n = len(section_cues)
    lead = [""] * n
    trail = [""] * n
    sep = [""] * n
    lead[0] = canon[: section_cues[0]["source_char_range"][0] - off]

    for i in range(n - 1):
        b = section_cues[i]["source_char_range"][1] - off
        a_next = section_cues[i + 1]["source_char_range"][0] - off
        gap = canon[b:a_next]
        if any(ch.isalnum() for ch in gap):
            raise BuildError(
                f"{slug}: alphanumeric content in gap after cue "
                f"{section_cues[i]['id']}: {gap!r}"
            )
        # Split at the last whitespace run: punctuation before it closes this
        # cue (kept with any inner space, e.g. French "mot :"); punctuation
        # after it opens the next cue (e.g. an opening guillemet).
        runs = list(re.finditer(r"\s+", gap))
        if runs:
            last = runs[-1]
            prev_part = gap[: last.start()]
            next_part = gap[last.end():]
            sep[i] = " "
        else:
            prev_part, next_part = gap, ""
            sep[i] = ""
        trail[i] += prev_part
        lead[i + 1] = next_part

        cross = para_index(section_cues[i]["source_char_range"][0] - off) != para_index(
            a_next
        )
        if cross:
            sep[i] = ""  # the paragraph break is the separator
        stats["total"] += 1
        if non_space(prev_part) or non_space(next_part):
            stats["punct"] += 1
        elif cross:
            stats["para"] += 1
        else:
            stats["word"] += 1

    trail[n - 1] += canon[section_cues[n - 1]["source_char_range"][1] - off :]

    paragraphs = [
        {"id": f"{slug}-p{j + 1:03d}", "speaker": speakers[j], "cues": []}
        for j in range(len(para_spans))
    ]
    crossings = 0
    for i, cue in enumerate(section_cues):
        local_start = cue["source_char_range"][0] - off
        local_end = cue["source_char_range"][1] - off
        j = para_index(local_start)
        if local_end > para_spans[j][1]:
            crossings += 1
        text = re.sub(r"\s+", " ", lead[i] + cue["text"] + trail[i]).strip()
        paragraphs[j]["cues"].append(
            {
                "id": cue["id"],
                "start": cue["start"],
                "end": cue["end"],
                "text": text,
                "sep": sep[i],
            }
        )
    for paragraph in paragraphs:
        if paragraph["cues"]:
            paragraph["cues"][-1]["sep"] = ""  # no inline space at a paragraph end

    rebuilt = "".join(
        lead[i] + section_cues[i]["text"] + trail[i] for i in range(n)
    )
    if non_space(rebuilt) != non_space(canon):
        raise BuildError(f"{slug}: punctuation preservation check failed")

    section_out = {
        "id": slug,
        "label": label,
        "isDialogue": is_dialogue,
        "paragraphs": paragraphs,
    }
    return section_out, crossings, canon


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
            f"{episode_id}: audio version mismatch — distribution "
            f"{Path(audio_url).name!r} vs transcript {transcript_audio!r}"
        )

    titles = SECTION_TITLES.get(show)
    if titles is None:
        raise BuildError(f"No section titles configured for show: {show}")

    cues_by_section: dict[str, list[dict]] = {}
    for cue in cues:
        cues_by_section.setdefault(cue["section"], []).append(cue)

    sections_out: list[dict] = []
    paragraph_count = 0
    crossing_count = 0
    mapped_ids: list[str] = []
    gap_stats = {"total": 0, "punct": 0, "para": 0, "word": 0}
    canon_all: list[str] = []
    old_all: list[str] = []
    new_all: list[str] = []

    for section in transcript["source"]["sections"]:
        slug = section["slug"]
        label = titles.get(slug)
        if label is None:
            raise BuildError(f"{episode_id}: no display label for section {slug!r}")
        if not (repo_dir / section["file"]).is_file():
            raise BuildError(f"{episode_id}: source text not found: {section['file']}")
        section_cues = cues_by_section.get(slug, [])
        old_all.append("".join(c["text"] for c in section_cues))
        section_out, crossings, canon = map_section(
            section, repo_dir, section_cues, label, gap_stats
        )
        canon_all.append(canon)
        new_all.append(
            "".join(c["text"] for p in section_out["paragraphs"] for c in p["cues"])
        )
        paragraph_count += len(section_out["paragraphs"])
        crossing_count += crossings
        for paragraph in section_out["paragraphs"]:
            mapped_ids.extend(c["id"] for c in paragraph["cues"])
        sections_out.append(section_out)

    all_ids = [c["id"] for c in cues]
    unmapped = len(all_ids) - len(mapped_ids)
    duplicates = len(mapped_ids) - len(set(mapped_ids))
    if sorted(mapped_ids) != sorted(all_ids) or unmapped or duplicates:
        raise BuildError(
            f"{episode_id}: cue mapping is not a 1:1 cover "
            f"(unmapped={unmapped}, duplicates={duplicates})"
        )

    canon_text, old_text, new_text = "".join(canon_all), "".join(old_all), "".join(new_all)
    loss_before = sum(max(0, canon_text.count(m) - old_text.count(m)) for m in PUNCT_MARKS)
    loss_after = sum(max(0, canon_text.count(m) - new_text.count(m)) for m in PUNCT_MARKS)
    if loss_after:
        raise BuildError(f"{episode_id}: {loss_after} punctuation marks still missing")

    payload = {
        "episode": {
            "id": episode_id,
            "title": episode_title,
            "showTitle": shared_show_value(show, "show_title"),
            "audioUrl": audio_url,
            "artworkUrl": shared_show_value(show, "artwork_url"),
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
        f"boundary-crossing-cues={crossing_count}\n"
        f"       gaps: total={gap_stats['total']} punct-attached={gap_stats['punct']} "
        f"paragraph-separators={gap_stats['para']} word-separators={gap_stats['word']} "
        f"alnum-gaps=0\n"
        f"       punctuation-loss: before={loss_before} after={loss_after}"
    )
    return out_path


def parse_args(argv: list[str]) -> list[tuple[str, int]]:
    if not argv:
        return list(DEFAULT_EPISODES)
    if len(argv) % 2 != 0:
        raise SystemExit("Usage: build-episode-cues.py [<show> <episode-number> ...]")
    return [(argv[i], int(argv[i + 1])) for i in range(0, len(argv), 2)]


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
