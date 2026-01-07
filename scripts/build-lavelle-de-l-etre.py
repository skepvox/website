#!/usr/bin/env python3
from pathlib import Path
import json
import sys

CHAPTER_DIR = Path('src/louis-lavelle/de-l-etre')
OUTPUT_FILE = Path('src/louis-lavelle/de-l-etre.md')
LOCAL_SOURCE_DIR = Path('local-books/louis-lavelle/de-l-etre/fr')

SITE_BASE = 'https://skepvox.com'
BOOK_PATH = '/louis-lavelle/de-l-etre'
BOOK_PATH_HTML = f'{BOOK_PATH}.html'
BOOK_URL = f'{SITE_BASE}{BOOK_PATH_HTML}'
BOOK_TITLE = "De l'être"
AUTHOR = 'Louis Lavelle'
LANGUAGE = 'fr'
DESCRIPTION = (
    "Texte intégral en français de De l'être de Louis Lavelle, "
    "premier volume de La Dialectique de l'éternel présent."
)
IMAGE_URL = (
    'https://skepvox.com/images/louis-lavelle/louis-lavelle-profile-picture.png'
)
SERIES_NAME = "La Dialectique de l'éternel présent"


def parse_frontmatter(text: str) -> dict:
    if not text.startswith('---'):
        return {}
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}
    fm = parts[1]
    data: dict[str, str] = {}
    for line in fm.splitlines():
        if not line or line.startswith('  '):
            continue
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        data[key.strip()] = value.strip().strip('"')
    return data


def split_frontmatter_block(text: str) -> tuple[str, str]:
    if not text.startswith('---'):
        return '', text
    lines = text.splitlines()
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            frontmatter = '\n'.join(lines[: i + 1])
            body = '\n'.join(lines[i + 1 :])
            return frontmatter, body
    return '', text


def strip_frontmatter(text: str) -> str:
    if not text.startswith('---'):
        return text
    lines = text.splitlines()
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            return '\n'.join(lines[i + 1 :])
    return text


def normalize_title(title: str) -> str:
    prefix = f"{BOOK_TITLE} — "
    if title.startswith(prefix):
        return title[len(prefix) :]
    return title


def sync_leaf_bodies() -> None:
    if not LOCAL_SOURCE_DIR.exists():
        return
    if not CHAPTER_DIR.exists():
        sys.exit(f'Missing chapters dir: {CHAPTER_DIR}')

    local_files = sorted(
        (path for path in LOCAL_SOURCE_DIR.glob('*.md') if path.is_file()),
        key=lambda path: path.name,
    )
    if not local_files:
        sys.exit(f'No local source files found in {LOCAL_SOURCE_DIR}')

    missing_targets = [
        path.name for path in local_files if not (CHAPTER_DIR / path.name).exists()
    ]
    if missing_targets:
        missing_list = ', '.join(missing_targets)
        sys.exit(f'Missing target chapter files in {CHAPTER_DIR}: {missing_list}')

    local_names = {path.name for path in local_files}
    extra_targets = sorted(
        path.name
        for path in CHAPTER_DIR.glob('*.md')
        if path.is_file() and path.name not in local_names
    )
    if extra_targets:
        extras = ', '.join(extra_targets)
        print(f'Warning: chapters without local source: {extras}', file=sys.stderr)

    back_link = f"[Retour au livre]({BOOK_PATH_HTML})"
    for local_path in local_files:
        target_path = CHAPTER_DIR / local_path.name
        local_text = local_path.read_text(encoding='utf-8')
        local_body = strip_frontmatter(local_text).lstrip('\n').rstrip()
        local_body = remove_hub_only_lines(local_body)
        new_body = f"{back_link}\n\n{local_body}".rstrip()

        target_text = target_path.read_text(encoding='utf-8')
        frontmatter, _ = split_frontmatter_block(target_text)
        if not frontmatter:
            sys.exit(f'Missing frontmatter in target file: {target_path}')

        new_text = f"{frontmatter}\n\n{new_body}\n"
        if new_text != target_text:
            target_path.write_text(new_text, encoding='utf-8')


def remove_hub_only_lines(body: str) -> str:
    lines = body.splitlines()
    filtered: list[str] = []
    back_links = {
        f"[Retour au livre]({BOOK_PATH})",
        f"[Retour au livre]({BOOK_PATH_HTML})",
    }
    for line in lines:
        if line.strip() in back_links:
            continue
        filtered.append(line)
    return '\n'.join(filtered).lstrip('\n').rstrip()


def remove_repeated_headings(
    body: str,
    *,
    book_title: str,
    part_title: str,
    drop_book_heading: bool,
    drop_part_heading: bool,
) -> str:
    lines = body.splitlines()
    filtered: list[str] = []
    book_heading = f"## {book_title}" if book_title else None
    part_heading = f"## {part_title}" if part_title else None
    skipped_book = False
    skipped_part = False

    for line in lines:
        stripped = line.strip()
        if drop_book_heading and book_heading and not skipped_book and stripped == book_heading:
            skipped_book = True
            continue
        if drop_part_heading and part_heading and not skipped_part and stripped == part_heading:
            skipped_part = True
            continue
        filtered.append(line)

    return '\n'.join(filtered).lstrip('\n').rstrip()


def format_conclusion_title(title: str) -> str:
    lower = title.lower()
    if not lower.startswith('conclusion'):
        return title
    remainder = title[len('Conclusion') :].lstrip()
    if remainder.startswith(('.', '—', ':', '-', '–')):
        remainder = remainder[1:].lstrip()
    return remainder or title


def format_introduction_title(title: str) -> str:
    lower = title.lower()
    if not lower.startswith('introduction'):
        return title
    remainder = title[len('Introduction') :].lstrip()
    if remainder.startswith(('.', '—', ':', '-', '–')):
        remainder = remainder[1:].lstrip()
    return remainder or title


def main() -> None:
    if not CHAPTER_DIR.exists():
        sys.exit(f'Missing chapters dir: {CHAPTER_DIR}')

    sync_leaf_bodies()

    chapter_files = sorted(
        (path for path in CHAPTER_DIR.glob('*.md') if path.is_file()),
        key=lambda path: path.name,
    )
    if not chapter_files:
        sys.exit(f'No chapter files found in {CHAPTER_DIR}')

    chapters = []
    bodies = []
    current_book_title = None
    current_part_title = None

    for path in chapter_files:
        text = path.read_text(encoding='utf-8')
        meta = parse_frontmatter(text)
        chapter_title = meta.get('chapter-title') or meta.get('title') or path.stem
        chapter_title = normalize_title(chapter_title)
        book_number = meta.get('book-number', '00')
        part_number = meta.get('part-number', '00')
        chapter_number = meta.get('chapter-number', '000')
        book_title = (meta.get('book-title') or '').strip()
        part_title = (meta.get('part-title') or '').strip()
        identifier = f"{book_number}-{part_number}-{chapter_number}"
        url_abs = f"{SITE_BASE}{BOOK_PATH}/{path.stem}.html"
        url_rel = f"{BOOK_PATH}/{path.stem}.html"
        chapters.append({
            'title': chapter_title,
            'url_abs': url_abs,
            'url_rel': url_rel,
            'identifier': identifier,
            'book_title': book_title,
            'part_title': part_title,
        })

        same_book = bool(book_title) and book_title == current_book_title
        if not same_book:
            current_part_title = None
        same_part = bool(part_title) and part_title == current_part_title

        body = strip_frontmatter(text).lstrip('\n').rstrip()
        body = remove_hub_only_lines(body)
        body = remove_repeated_headings(
            body,
            book_title=book_title,
            part_title=part_title,
            drop_book_heading=same_book,
            drop_part_heading=same_part,
        )
        bodies.append(body)

        current_book_title = book_title or None
        current_part_title = part_title or None

    toc_lines = ['## Table des matières', '']
    current_book = None
    current_part = None
    pending_intro = None
    pending_conclusion = None

    for chapter in chapters:
        title = chapter['title']
        book_title = chapter.get('book_title') or ''
        part_title = chapter.get('part_title') or ''

        if not book_title:
            if title.lower().startswith('introduction'):
                pending_intro = chapter
            elif title.lower().startswith('conclusion'):
                pending_conclusion = chapter
            else:
                toc_lines.append(f"- [{title}]({chapter['url_rel']})")
            continue

        if pending_intro:
            toc_lines.append('- Avant-propos')
            display_title = format_introduction_title(pending_intro['title'])
            toc_lines.append(f"  - [{display_title}]({pending_intro['url_rel']})")
            pending_intro = None

        if book_title != current_book:
            toc_lines.append(f"- {book_title}")
            current_book = book_title
            current_part = None

        if part_title:
            if part_title != current_part:
                toc_lines.append(f"  - {part_title}")
                current_part = part_title
            toc_lines.append(f"    - [{title}]({chapter['url_rel']})")
        else:
            toc_lines.append(f"  - [{title}]({chapter['url_rel']})")

    if pending_intro:
        toc_lines.append('- Avant-propos')
        display_title = format_introduction_title(pending_intro['title'])
        toc_lines.append(f"  - [{display_title}]({pending_intro['url_rel']})")
        pending_intro = None

    if pending_conclusion:
        toc_lines.append('- Conclusion')
        display_title = format_conclusion_title(pending_conclusion['title'])
        toc_lines.append(f"  - [{display_title}]({pending_conclusion['url_rel']})")
        pending_conclusion = None

    book_ld = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        'name': BOOK_TITLE,
        'author': {
            '@type': 'Person',
            'name': AUTHOR,
        },
        'inLanguage': LANGUAGE,
        'url': BOOK_URL,
        'description': DESCRIPTION,
        'image': IMAGE_URL,
        'isPartOf': {
            '@type': 'BookSeries',
            'name': SERIES_NAME,
        },
        'hasPart': [
            {
                '@type': 'Chapter',
                'name': chapter['title'],
                'url': chapter['url_abs'],
                'identifier': chapter['identifier'],
            }
            for chapter in chapters
        ],
    }

    item_list_ld = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListOrder': 'http://schema.org/ItemListOrderAscending',
        'numberOfItems': len(chapters),
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': idx + 1,
                'name': chapter['title'],
                'url': chapter['url_abs'],
            }
            for idx, chapter in enumerate(chapters)
        ],
    }

    breadcrumb_ld = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Louis Lavelle',
                'item': 'https://skepvox.com/louis-lavelle/',
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': BOOK_TITLE,
                'item': BOOK_URL,
            },
        ],
    }

    def json_block(data: dict) -> list[str]:
        return [f"      {line}" for line in json.dumps(data, ensure_ascii=False, indent=2).splitlines()]

    fm_lines = [
        '---',
        f'title: "{BOOK_TITLE} — {AUTHOR}"',
        f'description: "{DESCRIPTION}"',
        'outline: 2',
        'head:',
        '  - - link',
        '    - rel: canonical',
        f'      href: "{BOOK_URL}"',
        '  - - meta',
        '    - name: description',
        f'      content: "{DESCRIPTION}"',
        '  - - meta',
        '    - property: og:title',
        f'      content: "{BOOK_TITLE} — {AUTHOR}"',
        '  - - meta',
        '    - property: og:description',
        f'      content: "{DESCRIPTION}"',
        '  - - meta',
        '    - property: og:url',
        f'      content: "{BOOK_URL}"',
        '  - - meta',
        '    - property: og:type',
        '      content: book',
        '  - - meta',
        '    - property: og:image',
        f'      content: "{IMAGE_URL}"',
        '  - - meta',
        '    - property: og:image:alt',
        '      content: "Retrato de Louis Lavelle"',
        '  - - meta',
        '    - name: twitter:card',
        '      content: summary',
        '  - - meta',
        '    - name: twitter:title',
        f'      content: "{BOOK_TITLE} — {AUTHOR}"',
        '  - - meta',
        '    - name: twitter:description',
        f'      content: "{DESCRIPTION}"',
        '  - - meta',
        '    - name: twitter:image',
        f'      content: "{IMAGE_URL}"',
        '  - - meta',
        '    - name: twitter:image:alt',
        '      content: "Retrato de Louis Lavelle"',
        '  - - script',
        '    - type: application/ld+json',
        '    - |',
    ]
    fm_lines.extend(json_block(book_ld))
    fm_lines.extend([
        '  - - script',
        '    - type: application/ld+json',
        '    - |',
    ])
    fm_lines.extend(json_block(item_list_ld))
    fm_lines.extend([
        '  - - script',
        '    - type: application/ld+json',
        '    - |',
    ])
    fm_lines.extend(json_block(breadcrumb_ld))
    fm_lines.append('---')

    frontmatter = '\n'.join(fm_lines)
    body = '\n\n'.join(bodies)
    toc = '\n'.join(toc_lines)
    output = f"{frontmatter}\n\n# {BOOK_TITLE}\n\n{toc}\n\n{body}\n"
    OUTPUT_FILE.write_text(output, encoding='utf-8')


if __name__ == '__main__':
    main()
