#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path


WEBSITE_ROOT = Path(__file__).resolve().parent.parent
PROJECTS_ROOT = WEBSITE_ROOT.parent
SHOW_CONFIG_PATH = Path(__file__).resolve().with_name("podcast-show-config.json")
SHOW_CONFIG = json.loads(SHOW_CONFIG_PATH.read_text(encoding="utf-8"))

SLUG_RE = re.compile(r"^[a-z0-9-]+$")


def yaml_quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def show_value(show_key: str, field: str) -> str:
    show = SHOW_CONFIG.get(show_key)
    if not isinstance(show, dict):
        raise SystemExit(f"Unknown show: {show_key}")
    value = show.get(field)
    if not isinstance(value, str) or not value:
        raise SystemExit(f"Missing config field {field!r} for show {show_key}")
    return value


def normalize_slug(raw_slug: str, episode_number: int) -> str:
    slug = raw_slug.strip().lower()
    prefix = f"{episode_number:03d}-"
    if slug.startswith(prefix):
        slug = slug[len(prefix) :]
    if not slug or not SLUG_RE.fullmatch(slug):
        raise SystemExit("Slug must use lowercase ASCII letters, digits, and hyphens only.")
    return slug


def render_markdown(*, show_key: str, episode_number: int, episode_title: str, slug: str, pub_date: str, updated: str, status: str, explicit: str) -> str:
    show_title = show_value(show_key, "show_title")
    language_tag = show_value(show_key, "language_tag")
    show_page_url = show_value(show_key, "show_page_url")
    rss_feed_url = show_value(show_key, "rss_feed_url")
    artwork_url = show_value(show_key, "artwork_url")
    transcript_anchor = show_value(show_key, "transcript_anchor")
    rss_description_label = show_value(show_key, "rss_description_label")
    rss_page_tail = show_value(show_key, "rss_page_tail")

    website_episode_slug = f"{episode_number:03d}-{slug}"
    lesson_url = f"{show_page_url}{website_episode_slug}"
    rss_title = f"{episode_number:03d} - {episode_title}"
    distribution_stem = f"{show_key}-{website_episode_slug}"
    transcript_url = f"{lesson_url}#{transcript_anchor}"

    frontmatter = "\n".join(
        [
            "---",
            'asset: "podcast-episode-distribution"',
            f"episode-number: {episode_number}",
            f"episode-title: {yaml_quote(episode_title)}",
            f"rss-title: {yaml_quote(rss_title)}",
            f"episode-slug: {yaml_quote(website_episode_slug)}",
            f"show-title: {yaml_quote(show_title)}",
            'publisher: "skepvox"',
            'website: "https://www.skepvox.com"',
            f"show-page-url: {yaml_quote(show_page_url)}",
            f"lesson-url: {yaml_quote(lesson_url)}",
            f"rss-feed-url: {yaml_quote(rss_feed_url)}",
            'source-audio-file: ""',
            'r2-object-key: ""',
            'public-audio-url: ""',
            "enclosure-length: 0",
            'duration: "00:00:00"',
            'audio-revision: "pending"',
            f"pub-date: {yaml_quote(pub_date)}",
            f"explicit: {yaml_quote(explicit)}",
            f"status: {yaml_quote(status)}",
            f"updated: {yaml_quote(updated)}",
            "---",
        ]
    )

    body = "\n".join(
        [
            f"# Distribution Episode Info - {rss_title}",
            "",
            "## Publishing Fields",
            "",
            f"- RSS title: `{rss_title}`",
            f"- Show: `{show_title}`",
            "- Publisher: `skepvox`",
            "- Episode type: `Full`",
            f"- Episode number: `{episode_number}`",
            f"- Language: `{language_tag}`",
            f"- Explicit: `{explicit.title()}`",
            f"- Canonical episode page: {lesson_url}",
            f"- RSS feed: {rss_feed_url}",
            "- Public MP3: TBD",
            "- R2 object key: `TBD`",
            "- Enclosure length: `0`",
            "- Duration: `00:00:00`",
            "- Audio revision: `pending`",
            f"- Publication date: `{pub_date or 'TBD'}`",
            f"- Artwork: {artwork_url}",
            "",
            "## Audio Revision History",
            "",
            "| Revision | Public file | Duration | Enclosure length | Notes |",
            "| --- | --- | ---: | ---: | --- |",
            "| Draft | `TBD` | `00:00:00` | `0` | Fill after audio is rendered, staged, and approved. |",
            "",
            "## RSS Description",
            "",
            rss_description_label,
            transcript_url,
            "",
            "[Add one spoiler-safe lesson-focus sentence here.]",
            "",
            "[Add one spoiler-safe scene summary paragraph here.]",
            "",
            "[Add one grammar or usage-summary paragraph here.]",
            "",
            "[Add one vocabulary or lesson-guide paragraph here.]",
            "",
            rss_page_tail,
            "",
            "## Distribution Notes",
            "",
            f"- Scaffolded from `scripts/scaffold-podcast-distribution-episode.py` for `{distribution_stem}`.",
            f'- This file starts with `status: "{status}"` and is ignored by the release scanner until it is promoted to `rss-ready`.',
            "- This is not a Spotify upload record. It is the canonical distribution metadata for the skepvox-managed RSS feed.",
            "- Submit the RSS feed to Spotify and other directories; do not upload this episode manually to Spotify unless a temporary exception is recorded.",
            "- The RSS description must stay spoiler-safe and start with the anchored transcript link above.",
        ]
    )

    return f"{frontmatter}\n\n{body}\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Scaffold a draft distribution episode file for a skepvox podcast show.")
    parser.add_argument("--show", choices=sorted(SHOW_CONFIG), required=True)
    parser.add_argument("--episode-number", type=int, required=True)
    parser.add_argument("--episode-title", required=True)
    parser.add_argument("--slug", "--episode-slug", dest="slug", required=True)
    parser.add_argument("--pub-date", default="")
    parser.add_argument("--updated", default=date.today().isoformat())
    parser.add_argument("--status", default="draft")
    parser.add_argument("--explicit", default="no", choices=["no", "yes"])
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    slug = normalize_slug(args.slug, args.episode_number)
    filename = f"{args.show}-{args.episode_number:03d}-{slug}.md"
    target_path = PROJECTS_ROOT / show_value(args.show, "repo") / "distribution" / "episodes" / filename

    if target_path.exists() and not args.overwrite:
        raise SystemExit(f"Refusing to overwrite existing file: {target_path}")

    rendered = render_markdown(
        show_key=args.show,
        episode_number=args.episode_number,
        episode_title=args.episode_title.strip(),
        slug=slug,
        pub_date=args.pub_date.strip(),
        updated=args.updated.strip(),
        status=args.status.strip(),
        explicit=args.explicit,
    )
    target_path.write_text(rendered, encoding="utf-8")
    print(target_path)


if __name__ == "__main__":
    main()
