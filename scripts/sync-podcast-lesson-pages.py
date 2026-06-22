#!/usr/bin/env python3

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from _podcast_player_wiring import COMPONENT_TAG, HEADER_CLOSE, HEADER_OPEN, script_setup_block


ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT.parent
SHOW_CONFIG_PATH = Path(__file__).resolve().with_name("podcast-show-config.json")

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n?", re.DOTALL)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)
HTML_COMMENT_RE = re.compile(r"(?ms)^<!--.*?-->\s*")
SHARED_SHOW_CONFIG = json.loads(SHOW_CONFIG_PATH.read_text(encoding="utf-8"))


def shared_show_value(show_key: str, field: str) -> str:
    show_config = SHARED_SHOW_CONFIG.get(show_key)
    if not isinstance(show_config, dict):
        raise KeyError(f"Missing shared show config for: {show_key}")
    value = show_config.get(field)
    if not isinstance(value, str) or not value:
        raise KeyError(f"Missing shared show config field {field!r} for: {show_key}")
    return value


@dataclass(frozen=True)
class ShowConfig:
    key: str
    source_repo: str
    target_subdir: str
    page_title_prefix: str
    title_separator: str
    episode_label: str
    main_point_label: str
    permalink_label: str
    transcript_label: str
    guide_label: str
    intro_template: str
    transcript_intro: str
    guide_intro: str
    guide_heading: str
    script_heading: str
    canonical_base: str
    site_part_of_id: str
    fallback_description_template: str
    fallback_keywords_template: str
    og_locale: str
    artwork_url: str
    artwork_alt: str


SHOWS: tuple[ShowConfig, ...] = (
    ShowConfig(
        key="francais",
        source_repo=shared_show_value("francais", "repo"),
        target_subdir="src/podcast/francais",
        page_title_prefix=shared_show_value("francais", "show_title"),
        title_separator=" — ",
        episode_label="Épisode",
        main_point_label="Point principal",
        permalink_label="Lien permanent",
        transcript_label=shared_show_value("francais", "transcript_heading"),
        guide_label="Notes",
        intro_template=(
            "Page de l’épisode {episode_number:03d} de Vox Français : "
            "{episode_title}, avec audio, transcription et notes."
        ),
        transcript_intro=(
            "Utilisez les sections suivantes pour accéder directement à la "
            "transcription, au dialogue lent, à l’explication et à la reprise à "
            "vitesse naturelle."
        ),
        guide_intro=(
            "Je garde ici le vocabulaire, les remarques d’usage et quelques "
            "repères de contexte."
        ),
        guide_heading="Guide d'apprentissage",
        script_heading="Script complet",
        canonical_base=shared_show_value("francais", "show_page_url").rstrip("/"),
        site_part_of_id=f"{shared_show_value('francais', 'show_page_url')}#webpage",
        fallback_description_template=(
            "Page de l’épisode {episode_number:03d} de Vox Français : "
            "{episode_title}, avec audio, transcription et notes."
        ),
        fallback_keywords_template=(
            "Vox Français, skepvox, {episode_title}, français langue étrangère, "
            "FLE, transcription, dialogue français, notes"
        ),
        og_locale="fr_FR",
        artwork_url=shared_show_value("francais", "artwork_url"),
        artwork_alt="Couverture de Vox Français",
    ),
    ShowConfig(
        key="espanol",
        source_repo=shared_show_value("espanol", "repo"),
        target_subdir="src/podcast/espanol",
        page_title_prefix=shared_show_value("espanol", "show_title"),
        title_separator=" - ",
        episode_label="Episodio",
        main_point_label="Punto principal",
        permalink_label="Enlace permanente",
        transcript_label=shared_show_value("espanol", "transcript_heading"),
        guide_label="Notas",
        intro_template=(
            "Página del episodio {episode_number:03d} de Vox Español: "
            "{episode_title}, con audio, transcripción y notas."
        ),
        transcript_intro=(
            "Use las secciones siguientes para entrar directamente en la "
            "transcripción, en la versión lenta, en la explicación y en la "
            "repetición a velocidad natural."
        ),
        guide_intro=(
            "Guardo aquí el vocabulario, algunas notas de uso y un poco de "
            "contexto."
        ),
        guide_heading="Guía de aprendizaje",
        script_heading="Guión completo",
        canonical_base=shared_show_value("espanol", "show_page_url").rstrip("/"),
        site_part_of_id=f"{shared_show_value('espanol', 'show_page_url')}#webpage",
        fallback_description_template=(
            "Página del episodio {episode_number:03d} de Vox Español: "
            "{episode_title}, con audio, transcripción y notas."
        ),
        fallback_keywords_template=(
            "Vox Español, skepvox, {episode_title}, español como lengua extranjera, "
            "ELE, transcripción, diálogo español, notas"
        ),
        og_locale="es_ES",
        artwork_url=shared_show_value("espanol", "artwork_url"),
        artwork_alt="Portada de Vox Español",
    ),
    ShowConfig(
        key="english",
        source_repo=shared_show_value("english", "repo"),
        target_subdir="src/podcast/english",
        page_title_prefix=shared_show_value("english", "show_title"),
        title_separator=" - ",
        episode_label="Episode",
        main_point_label="Main point",
        permalink_label="Permanent link",
        transcript_label=shared_show_value("english", "transcript_heading"),
        guide_label="Notes",
        intro_template=(
            "Episode page for Vox English {episode_number:03d}: "
            "{episode_title}, with audio, transcript, and notes."
        ),
        transcript_intro=(
            "Use the sections below to go directly to the transcript, the slow "
            "version, the explanation and the natural-speed repetition."
        ),
        guide_intro=(
            "I keep the vocabulary, usage notes, and a little context here."
        ),
        guide_heading="Learning Guide",
        script_heading="Full Script",
        canonical_base=shared_show_value("english", "show_page_url").rstrip("/"),
        site_part_of_id=f"{shared_show_value('english', 'show_page_url')}#webpage",
        fallback_description_template=(
            "Episode page for Vox English {episode_number:03d}: "
            "{episode_title}, with audio, transcript, and notes."
        ),
        fallback_keywords_template=(
            "Vox English, skepvox, {episode_title}, English learning, "
            "English conversation, transcript, dialogue, notes"
        ),
        og_locale="en_US",
        artwork_url=shared_show_value("english", "artwork_url"),
        artwork_alt="Vox English cover art",
    ),
)


def split_frontmatter(text: str) -> tuple[str, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        raise ValueError("Missing YAML frontmatter")
    raw_frontmatter = match.group(1)
    body = text[match.end() :].lstrip("\n")
    return raw_frontmatter, body


def strip_quotes(value: str) -> str:
    value = value.strip()
    if value in {"null", "Null", "NULL"}:
        return ""
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        quote = value[0]
        inner = value[1:-1]
        if quote == '"':
            inner = inner.replace('\\"', '"')
        else:
            inner = inner.replace("\\'", "'")
        return inner
    return value


def parse_source_scalar(frontmatter: str, key: str) -> str:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+)$", frontmatter)
    if not match:
        raise KeyError(f"Missing frontmatter key: {key}")
    return strip_quotes(match.group(1))


def parse_source_scalar_optional(frontmatter: str, key: str) -> str:
    try:
        return parse_source_scalar(frontmatter, key)
    except KeyError:
        return ""


def parse_headings(text: str) -> list[dict[str, str | int]]:
    matches = list(HEADING_RE.finditer(text))
    headings: list[dict[str, str | int]] = []
    for idx, match in enumerate(matches):
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        headings.append(
            {
                "level": len(match.group(1)),
                "title": match.group(2).strip(),
                "content": text[match.end() : end].strip(),
            }
        )
    return headings


def children_of(parent_title: str, parent_level: int, headings: list[dict[str, str | int]]) -> list[dict[str, str | int]]:
    for idx, heading in enumerate(headings):
        if heading["level"] == parent_level and heading["title"] == parent_title:
            end_idx = len(headings)
            for probe in range(idx + 1, len(headings)):
                if int(headings[probe]["level"]) <= parent_level:
                    end_idx = probe
                    break
            return [child for child in headings[idx + 1 : end_idx] if int(child["level"]) == parent_level + 1]
    raise ValueError(f"Missing heading: {parent_title}")


def canonical_url(show: ShowConfig, slug: str) -> str:
    return f"{show.canonical_base}/{slug}"


def yaml_quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def indent(text: str, spaces: int) -> str:
    prefix = " " * spaces
    return "\n".join(f"{prefix}{line}" if line else prefix.rstrip() for line in text.splitlines())


def normalize_existing_frontmatter(raw_frontmatter: str) -> str:
    if re.search(r"(?m)^outline:\s*.+$", raw_frontmatter):
        raw_frontmatter = re.sub(r"(?m)^outline:\s*.+$", "outline: 2", raw_frontmatter)
    else:
        raw_frontmatter = raw_frontmatter.rstrip() + "\noutline: 2"
    return raw_frontmatter.strip()


def strip_internal_comments(text: str) -> str:
    return HTML_COMMENT_RE.sub("", text).strip()


def parse_existing_top_level_scalar(frontmatter: str, key: str) -> str:
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+)$", frontmatter)
    if not match:
        return ""
    return strip_quotes(match.group(1))


def parse_existing_meta_content(frontmatter: str, attr: str, value: str) -> str:
    pattern = re.compile(
        rf"(?ms)^  - - meta\n    - {re.escape(attr)}: {re.escape(value)}\n      content:\s*(.+?)$"
    )
    match = pattern.search(frontmatter)
    if not match:
        return ""
    return strip_quotes(match.group(1))


def build_new_frontmatter(show: ShowConfig, page_title: str, description: str, keywords: str, url: str, teaches: str, language: str, is_buffer: bool = False) -> str:
    json_ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "LearningResource",
            "@id": f"{url}#learning-resource",
            "url": url,
            "name": page_title,
            "description": description,
            "image": {
                "@type": "ImageObject",
                "url": show.artwork_url,
                "width": 3000,
                "height": 3000,
            },
            "learningResourceType": ["podcast transcript", "study notes"],
            "teaches": teaches,
            "inLanguage": language,
            "publisher": {"@id": "https://www.skepvox.com/#organization"},
            "isPartOf": {"@id": show.site_part_of_id},
        },
        ensure_ascii=False,
        indent=2,
    )

    lines = [
        f"title: {yaml_quote(page_title)}",
        f"description: {yaml_quote(description)}",
        "outline: 2",
        "footer: false",
        "head:",
        "  - - link",
        "    - rel: canonical",
        f"      href: {yaml_quote(url)}",
        "  - - meta",
        "    - name: description",
        f"      content: {yaml_quote(description)}",
        "  - - meta",
        "    - name: keywords",
        f"      content: {yaml_quote(keywords)}",
        "  - - meta",
        "    - property: og:title",
        f"      content: {yaml_quote(page_title)}",
        "  - - meta",
        "    - property: og:description",
        f"      content: {yaml_quote(description)}",
        "  - - meta",
        "    - property: og:url",
        f"      content: {yaml_quote(url)}",
        "  - - meta",
        "    - property: og:type",
        "      content: article",
        "  - - meta",
        "    - property: og:site_name",
        "      content: skepvox",
        "  - - meta",
        "    - property: og:locale",
        f"      content: {show.og_locale}",
        "  - - meta",
        "    - property: og:image",
        f"      content: {yaml_quote(show.artwork_url)}",
        "  - - meta",
        "    - property: og:image:type",
        "      content: image/jpeg",
        "  - - meta",
        "    - property: og:image:width",
        "      content: \"3000\"",
        "  - - meta",
        "    - property: og:image:height",
        "      content: \"3000\"",
        "  - - meta",
        "    - property: og:image:alt",
        f"      content: {yaml_quote(show.artwork_alt)}",
        "  - - meta",
        "    - name: twitter:card",
        "      content: summary_large_image",
        "  - - meta",
        "    - name: twitter:title",
        f"      content: {yaml_quote(page_title)}",
        "  - - meta",
        "    - name: twitter:description",
        f"      content: {yaml_quote(description)}",
        "  - - meta",
        "    - name: twitter:image",
        f"      content: {yaml_quote(show.artwork_url)}",
        "  - - meta",
        "    - name: twitter:image:alt",
        f"      content: {yaml_quote(show.artwork_alt)}",
        "  - - script",
        "    - type: application/ld+json",
        "    - |",
        indent(json_ld, 6),
    ]
    if is_buffer:
        outline_index = lines.index("outline: 2")
        lines[outline_index:outline_index] = ["search: false", "buffer: true"]
        head_index = lines.index("head:")
        lines[head_index + 1 : head_index + 1] = [
            "  - - meta",
            "    - name: robots",
            f"      content: {yaml_quote('noindex, nofollow')}",
        ]
    return "\n".join(lines)


def build_frontmatter(show: ShowConfig, source_frontmatter: str, page_title: str, url: str, existing_frontmatter: str | None, is_buffer: bool = False) -> str:
    episode_number = int(parse_source_scalar(source_frontmatter, "episode-number"))
    episode_title = parse_source_scalar(source_frontmatter, "episode-title")
    main_grammar_point = parse_source_scalar(source_frontmatter, "main-grammar-point")
    language = parse_source_scalar(source_frontmatter, "language")
    description = show.fallback_description_template.format(
        episode_number=episode_number,
        episode_title=episode_title,
        main_grammar_point=main_grammar_point,
    )
    keywords = show.fallback_keywords_template.format(
        episode_number=episode_number,
        episode_title=episode_title,
        main_grammar_point=main_grammar_point,
    )
    return build_new_frontmatter(show, page_title, description, keywords, url, main_grammar_point, language, is_buffer)


def render_body(show: ShowConfig, source_frontmatter: str, body: str, website_slug: str) -> str:
    headings = parse_headings(body)
    guide_sections = children_of(show.guide_heading, 2, headings)

    main_grammar_point = parse_source_scalar(source_frontmatter, "main-grammar-point")

    # Compact "lesson thesis" header: eyebrow + episode-title H1 + the learning
    # point as the lede (slot text). The boilerplate intro, the Épisode label, the
    # raw permalink and the "Transcript" H2 are intentionally gone; the player
    # follows immediately so it sits high on the page (mobile especially).
    parts = [
        script_setup_block(f"{website_slug}.cues.json"),
        "",
        HEADER_OPEN,
        main_grammar_point,
        HEADER_CLOSE,
        "",
        COMPONENT_TAG,
        "",
        f"## {show.guide_label}",
        "",
        show.guide_intro,
        "",
    ]

    for section in guide_sections:
        parts.extend([f"## {section['title']}", "", strip_internal_comments(str(section["content"])), ""])

    rendered = "\n".join(parts).rstrip() + "\n"
    cleaned_lines = [line.rstrip() for line in rendered.splitlines()]
    return "\n".join(cleaned_lines).rstrip() + "\n"


def render_document(frontmatter: str, body: str) -> str:
    return f"---\n{frontmatter.strip()}\n---\n\n{body}"


# Upstream distribution statuses that mark an episode as an unlisted buffer
# (noindex, excluded from indexes/sitemap, reachable only by direct URL).
BUFFER_STATUSES = {"buffer", "draft"}


def configured_numbers(show: ShowConfig) -> set[int]:
    """Registered website episode numbers for a show (the page allowlist)."""
    show_config = SHARED_SHOW_CONFIG.get(show.key)
    numbers = show_config.get("episodes") if isinstance(show_config, dict) else None
    if not isinstance(numbers, list):
        raise KeyError(f"Missing 'episodes' registry for show: {show.key}")
    return {int(number) for number in numbers}


def distribution_status(show: ShowConfig, episode_number: int) -> str:
    """Upstream distribution status for an episode, or '' when unavailable.

    The distribution file is the single source of truth for whether a page is
    indexable or an unlisted buffer; page existence is decided by the registry.
    """
    episode_id = f"{show.key}-{episode_number:03d}"
    dist_dir = PROJECTS / show.source_repo / "distribution" / "episodes"
    matches = sorted(dist_dir.glob(f"{episode_id}-*.md"))
    if not matches:
        return ""
    try:
        frontmatter, _ = split_frontmatter(matches[0].read_text())
    except ValueError:
        return ""
    return parse_existing_top_level_scalar(frontmatter, "status")


# Localized "episode" noun for the hub show-card meta line, by show key.
EPISODE_NOUN = {
    "francais": ("épisode", "épisodes"),
    "espanol": ("episodio", "episodios"),
    "english": ("episode", "episodes"),
}


def show_blurb(target_dir: Path) -> str:
    """The show's own page description, reused as the hub card blurb."""
    index_path = target_dir / "index.md"
    if not index_path.exists():
        return ""
    try:
        frontmatter, _ = split_frontmatter(index_path.read_text())
    except ValueError:
        return ""
    return parse_existing_top_level_scalar(frontmatter, "description")


def build_show_entry(show: ShowConfig, site_rel: str, target_dir: Path, episode_count: int) -> dict:
    """Hub show-card entry; episode_count is the public count (buffers excluded)."""
    singular, plural = EPISODE_NOUN.get(show.key, ("episode", "episodes"))
    return {
        "title": show.page_title_prefix,
        "href": f"/{site_rel}/",
        "description": show_blurb(target_dir),
        "imageUrl": show.artwork_url,
        "imageAlt": show.artwork_alt,
        "episodeCount": episode_count,
        "meta": f"{episode_count} {singular if episode_count == 1 else plural}",
    }


def sync_show(show: ShowConfig) -> tuple[list[Path], dict]:
    source_dir = PROJECTS / show.source_repo / "episodes"
    target_dir = ROOT / show.target_subdir
    site_rel = show.target_subdir.removeprefix("src/")
    registry = configured_numbers(show)
    changed: list[Path] = []
    manifest: list[dict] = []

    for source_path in sorted(source_dir.glob("*.md")):
        if source_path.name == "README.md":
            continue

        source_frontmatter, source_body = split_frontmatter(source_path.read_text())
        episode_number = int(parse_source_scalar(source_frontmatter, "episode-number"))
        if episode_number not in registry:
            continue

        episode_title = parse_source_scalar(source_frontmatter, "episode-title")
        main_grammar_point = parse_source_scalar(source_frontmatter, "main-grammar-point")
        card_description = (
            parse_source_scalar_optional(source_frontmatter, "card-description") or main_grammar_point
        )
        slug = parse_source_scalar(source_frontmatter, "slug")
        website_slug = f"{episode_number:03d}-{slug}"
        target_path = target_dir / f"{website_slug}.md"

        cues_path = target_dir / f"{website_slug}.cues.json"
        if not cues_path.exists():
            raise FileNotFoundError(
                f"{show.key}-{episode_number:03d}: missing cue JSON "
                f"{cues_path.relative_to(ROOT)}; run build-episode-cues.py before "
                f"syncing player pages"
            )

        is_buffer = distribution_status(show, episode_number).strip().lower() in BUFFER_STATUSES

        existing_frontmatter: str | None = None
        if target_path.exists():
            existing_frontmatter, _existing_body = split_frontmatter(target_path.read_text())

        page_title = f"{show.page_title_prefix} {episode_number:03d}{show.title_separator}{episode_title}"
        url = canonical_url(show, website_slug)
        frontmatter = build_frontmatter(show, source_frontmatter, page_title, url, existing_frontmatter, is_buffer)
        body = render_body(show, source_frontmatter, source_body, website_slug)
        rendered = render_document(frontmatter, body)

        if not target_path.exists() or target_path.read_text() != rendered:
            target_path.write_text(rendered)
            changed.append(target_path)

        # Buffer/draft episodes stay off the public catalog manifest (and the grid).
        if not is_buffer:
            episode = json.loads(cues_path.read_text(encoding="utf-8")).get("episode", {})
            manifest.append(
                {
                    "number": episode_number,
                    "title": episode_title,
                    "href": f"/{site_rel}/{website_slug}",
                    "durationSeconds": episode.get("durationSeconds"),
                    "description": card_description,
                    "artworkUrl": episode.get("artworkUrl"),
                }
            )

    manifest.sort(key=lambda entry: entry["number"])
    manifest_path = target_dir / "episodes.json"
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if not manifest_path.exists() or manifest_path.read_text() != manifest_text:
        manifest_path.write_text(manifest_text)
        changed.append(manifest_path)

    return changed, build_show_entry(show, site_rel, target_dir, len(manifest))


def main() -> None:
    changed: list[Path] = []
    shows: list[dict] = []
    for show in SHOWS:
        show_changed, show_entry = sync_show(show)
        changed.extend(show_changed)
        shows.append(show_entry)

    shows_path = ROOT / "src" / "podcast" / "shows.json"
    shows_text = json.dumps(shows, ensure_ascii=False, indent=2) + "\n"
    if not shows_path.exists() or shows_path.read_text() != shows_text:
        shows_path.write_text(shows_text)
        changed.append(shows_path)

    if not changed:
        print("No podcast lesson page changes.")
        return

    for path in changed:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
