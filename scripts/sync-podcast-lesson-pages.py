#!/usr/bin/env python3

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT.parent

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n?", re.DOTALL)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)


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


SHOWS: tuple[ShowConfig, ...] = (
    ShowConfig(
        key="english",
        source_repo="skepvox-podcast-english",
        target_subdir="src/podcast/english",
        page_title_prefix="Vox English",
        title_separator=" - ",
        episode_label="Episode",
        main_point_label="Main point",
        permalink_label="Permanent link",
        transcript_label="Full transcript",
        guide_label="Learning Guide",
        intro_template=(
            "This page accompanies episode {episode_number:03d} of Vox English, "
            "a skepvox series by Thiago Oliveira for advanced English learners. "
            "It brings together the full transcript, dialogue, and learning guide."
        ),
        transcript_intro=(
            "Use the sections below to jump straight into the episode transcript, "
            "slow replay, explanation, and natural-speed replay."
        ),
        guide_intro=(
            "The study sections below review the vocabulary, comprehension "
            "questions, usage notes, and answer key."
        ),
        guide_heading="Learning Guide",
        script_heading="Complete Script",
        canonical_base="https://skepvox.com/podcast/english",
        site_part_of_id="https://skepvox.com/podcast/english/#webpage",
        fallback_description_template=(
            "Lesson guide and transcript for episode {episode_number:03d} of Vox "
            "English: {episode_title}. {main_grammar_point}"
        ),
        fallback_keywords_template=(
            "Vox English, skepvox, {episode_title}, English as a Foreign Language, "
            "EFL, transcript, English dialogue, lesson guide"
        ),
        og_locale="en_US",
    ),
    ShowConfig(
        key="francais",
        source_repo="skepvox-podcast-francais",
        target_subdir="src/podcast/francais",
        page_title_prefix="Vox Français",
        title_separator=" — ",
        episode_label="Épisode",
        main_point_label="Point principal",
        permalink_label="Lien permanent",
        transcript_label="Transcription complète",
        guide_label="Guide d'apprentissage",
        intro_template=(
            "Cette page accompagne l’épisode {episode_number:03d} de Vox Français, "
            "une série skepvox de Thiago Oliveira pour apprendre le français. "
            "Elle réunit la transcription complète, le dialogue et le guide "
            "d’apprentissage."
        ),
        transcript_intro=(
            "Utilisez les sections suivantes pour accéder directement à la "
            "transcription, au dialogue lent, à l’explication et à la reprise à "
            "vitesse naturelle."
        ),
        guide_intro=(
            "Les sections suivantes regroupent le vocabulaire, les questions de "
            "compréhension, les notes d’usage et les réponses."
        ),
        guide_heading="Guide d'apprentissage",
        script_heading="Script complet",
        canonical_base="https://skepvox.com/podcast/francais",
        site_part_of_id="https://skepvox.com/podcast/francais/#webpage",
        fallback_description_template=(
            "Guide de leçon et transcription de l’épisode {episode_number:03d} de "
            "Vox Français : {episode_title}. {main_grammar_point}"
        ),
        fallback_keywords_template=(
            "Vox Français, skepvox, {episode_title}, français langue étrangère, "
            "FLE, transcription, dialogue français, guide de leçon"
        ),
        og_locale="fr_FR",
    ),
    ShowConfig(
        key="espanol",
        source_repo="skepvox-podcast-espanol",
        target_subdir="src/podcast/espanol",
        page_title_prefix="Vox Español",
        title_separator=" - ",
        episode_label="Episodio",
        main_point_label="Punto principal",
        permalink_label="Enlace permanente",
        transcript_label="Transcripción completa",
        guide_label="Guía de aprendizaje",
        intro_template=(
            "Esta página acompaña el episodio {episode_number:03d} de Vox Español, "
            "una serie skepvox de Thiago Oliveira para aprender español. Reúne la "
            "transcripción completa, el diálogo y la guía de aprendizaje."
        ),
        transcript_intro=(
            "Use las secciones siguientes para entrar directamente en la "
            "transcripción, en la versión lenta, en la explicación y en la "
            "repetición a velocidad natural."
        ),
        guide_intro=(
            "Las secciones siguientes reúnen el vocabulario, las preguntas de "
            "comprensión, las notas de uso y las respuestas."
        ),
        guide_heading="Guía de aprendizaje",
        script_heading="Guión completo",
        canonical_base="https://skepvox.com/podcast/espanol",
        site_part_of_id="https://skepvox.com/podcast/espanol/#webpage",
        fallback_description_template=(
            "Guía de lección y transcripción del episodio {episode_number:03d} de "
            "Vox Español: {episode_title}. {main_grammar_point}"
        ),
        fallback_keywords_template=(
            "Vox Español, skepvox, {episode_title}, español como lengua extranjera, "
            "ELE, transcripción, diálogo español, guía de lección"
        ),
        og_locale="es_ES",
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


def build_new_frontmatter(show: ShowConfig, page_title: str, description: str, keywords: str, url: str, teaches: str, language: str) -> str:
    json_ld = json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "LearningResource",
            "@id": f"{url}#learning-resource",
            "url": url,
            "name": page_title,
            "description": description,
            "learningResourceType": ["podcast transcript", "lesson guide"],
            "teaches": teaches,
            "inLanguage": language,
            "publisher": {"@id": "https://skepvox.com/#organization"},
            "isPartOf": {"@id": show.site_part_of_id},
        },
        ensure_ascii=False,
        indent=2,
    )

    lines = [
        f"title: {yaml_quote(page_title)}",
        f"description: {yaml_quote(description)}",
        "outline: 2",
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
        "    - name: twitter:card",
        "      content: summary_large_image",
        "  - - meta",
        "    - name: twitter:title",
        f"      content: {yaml_quote(page_title)}",
        "  - - meta",
        "    - name: twitter:description",
        f"      content: {yaml_quote(description)}",
        "  - - script",
        "    - type: application/ld+json",
        "    - |",
        indent(json_ld, 6),
    ]
    return "\n".join(lines)


def build_frontmatter(show: ShowConfig, source_frontmatter: str, page_title: str, url: str, existing_frontmatter: str | None) -> str:
    if existing_frontmatter is not None:
        return normalize_existing_frontmatter(existing_frontmatter)

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
    return build_new_frontmatter(show, page_title, description, keywords, url, main_grammar_point, language)


def render_body(show: ShowConfig, source_frontmatter: str, body: str, page_title: str, url: str) -> str:
    headings = parse_headings(body)
    script_sections = children_of(show.script_heading, 2, headings)
    guide_sections = children_of(show.guide_heading, 2, headings)

    episode_number = int(parse_source_scalar(source_frontmatter, "episode-number"))
    episode_title = parse_source_scalar(source_frontmatter, "episode-title")
    main_grammar_point = parse_source_scalar(source_frontmatter, "main-grammar-point")

    parts = [
        f"# {page_title}",
        "",
        show.intro_template.format(episode_number=episode_number),
        "",
        f"**{show.episode_label}:** {episode_title}",
        "",
        f"**{show.main_point_label}:** {main_grammar_point}",
        "",
        f"**{show.permalink_label}:** <{url}>",
        "",
        f"## {show.transcript_label}",
        "",
        show.transcript_intro,
        "",
    ]

    for section in script_sections:
        parts.extend([f"## {section['title']}", "", str(section["content"]), ""])

    parts.extend([f"## {show.guide_label}", "", show.guide_intro, ""])

    for section in guide_sections:
        parts.extend([f"## {section['title']}", "", str(section["content"]), ""])

    rendered = "\n".join(parts).rstrip() + "\n"
    cleaned_lines = [line.rstrip() for line in rendered.splitlines()]
    return "\n".join(cleaned_lines).rstrip() + "\n"


def render_document(frontmatter: str, body: str) -> str:
    return f"---\n{frontmatter.strip()}\n---\n\n{body}"


def sync_show(show: ShowConfig) -> list[Path]:
    source_dir = PROJECTS / show.source_repo / "episodes"
    target_dir = ROOT / show.target_subdir
    changed: list[Path] = []

    for source_path in sorted(source_dir.glob("*.md")):
        if source_path.name == "README.md":
            continue

        source_frontmatter, source_body = split_frontmatter(source_path.read_text())
        episode_number = int(parse_source_scalar(source_frontmatter, "episode-number"))
        episode_title = parse_source_scalar(source_frontmatter, "episode-title")
        slug = parse_source_scalar(source_frontmatter, "slug")
        website_slug = f"{episode_number:03d}-{slug}"
        target_path = target_dir / f"{website_slug}.md"

        existing_frontmatter: str | None = None
        if target_path.exists():
            existing_frontmatter, _existing_body = split_frontmatter(target_path.read_text())

        page_title = f"{show.page_title_prefix} {episode_number:03d}{show.title_separator}{episode_title}"
        url = canonical_url(show, website_slug)
        frontmatter = build_frontmatter(show, source_frontmatter, page_title, url, existing_frontmatter)
        body = render_body(show, source_frontmatter, source_body, page_title, url)
        rendered = render_document(frontmatter, body)

        if not target_path.exists() or target_path.read_text() != rendered:
            target_path.write_text(rendered)
            changed.append(target_path)

    return changed


def main() -> None:
    changed: list[Path] = []
    for show in SHOWS:
        changed.extend(sync_show(show))

    if not changed:
        print("No podcast lesson page changes.")
        return

    for path in changed:
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
