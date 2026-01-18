#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import re
import sys

SITE_BASE = 'https://skepvox.com'

AUTHOR = 'Graciliano Ramos'
AUTHOR_SLUG = 'graciliano-ramos'
AUTHOR_PATH = f'/literatura/{AUTHOR_SLUG}/'
AUTHOR_URL = f'{SITE_BASE}{AUTHOR_PATH}'
AUTHOR_IMAGE_URL = f'{SITE_BASE}/images/authors/{AUTHOR_SLUG}.png'

BOOK_TITLE = 'Angústia'
BOOK_SLUG = 'angustia'
BOOK_PATH = f'/literatura/{AUTHOR_SLUG}/{BOOK_SLUG}'
BOOK_PATH_HTML = f'{BOOK_PATH}.html'
BOOK_URL = f'{SITE_BASE}{BOOK_PATH_HTML}'
BOOK_DESCRIPTION = (
    'Texto integral de Angústia, de Graciliano Ramos, '
    'com capítulos separados para leitura.'
)

LANGUAGE = 'pt-BR'

CHAPTER_DIR = Path(f'src/literatura/{AUTHOR_SLUG}/{BOOK_SLUG}')
OUTPUT_FILE = Path(f'src/literatura/{AUTHOR_SLUG}/{BOOK_SLUG}.md')
LOCAL_SOURCE_DIR = Path(f'local-books/{AUTHOR_SLUG}/{BOOK_SLUG}/pt')


def yaml_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


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


def strip_frontmatter(text: str) -> str:
    if not text.startswith('---'):
        return text
    lines = text.splitlines()
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            return '\n'.join(lines[i + 1 :])
    return text


def parse_file_id(filename: str) -> tuple[str, str, str]:
    match = re.match(r'^(\d{2})-(\d{2})-(\d{3})-', filename)
    if not match:
        return '00', '00', '000'
    return match.group(1), match.group(2), match.group(3)


def remove_hub_only_lines(body: str) -> str:
    lines = body.splitlines()
    filtered: list[str] = []
    back_links = {
        f'[Voltar ao livro]({BOOK_PATH})',
        f'[Voltar ao livro]({BOOK_PATH_HTML})',
    }
    for line in lines:
        if line.strip() in back_links:
            continue
        filtered.append(line)
    return '\n'.join(filtered).lstrip('\n').rstrip()


def build_chapter_frontmatter(*, chapter_title: str, url_abs: str, identifier: str) -> str:
    title = f'{BOOK_TITLE} — {chapter_title}'
    description = f'Texto integral de {BOOK_TITLE}, de {AUTHOR}. {chapter_title}.'

    chapter_ld = {
        '@context': 'https://schema.org',
        '@type': 'Chapter',
        'name': chapter_title,
        'identifier': identifier,
        'url': url_abs,
        'mainEntityOfPage': url_abs,
        'inLanguage': LANGUAGE,
        'isAccessibleForFree': True,
        'author': {'@type': 'Person', 'name': AUTHOR},
        'isPartOf': {
            '@type': 'Book',
            'name': BOOK_TITLE,
            'author': {'@type': 'Person', 'name': AUTHOR},
            'url': BOOK_URL,
        },
        'image': AUTHOR_IMAGE_URL,
        'description': description,
        'additionalProperty': [
            {'@type': 'PropertyValue', 'name': 'chapter-title', 'value': chapter_title},
        ],
    }

    breadcrumb_ld = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': AUTHOR, 'item': AUTHOR_URL},
            {'@type': 'ListItem', 'position': 2, 'name': BOOK_TITLE, 'item': BOOK_URL},
            {'@type': 'ListItem', 'position': 3, 'name': chapter_title, 'item': url_abs},
        ],
    }

    def json_block(data: dict) -> list[str]:
        return [
            f'      {line}'
            for line in json.dumps(data, ensure_ascii=False, indent=2).splitlines()
        ]

    fm_lines = [
        '---',
        f'title: {yaml_str(title)}',
        f'description: {yaml_str(description)}',
        'sidebar: false',
        'aside: false',
        'footer: false',
        'outline: false',
        f'book: {yaml_str(BOOK_TITLE)}',
        f'author: {yaml_str(AUTHOR)}',
        f'language: {yaml_str(LANGUAGE)}',
        f'chapter-id: {yaml_str(identifier)}',
        f'chapter-title: {yaml_str(chapter_title)}',
        'head:',
        '  - - link',
        '    - rel: canonical',
        f'      href: {yaml_str(url_abs)}',
        '  - - meta',
        '    - name: description',
        f'      content: {yaml_str(description)}',
        '  - - meta',
        '    - property: og:title',
        f'      content: {yaml_str(title)}',
        '  - - meta',
        '    - property: og:description',
        f'      content: {yaml_str(description)}',
        '  - - meta',
        '    - property: og:url',
        f'      content: {yaml_str(url_abs)}',
        '  - - meta',
        '    - property: og:type',
        '      content: article',
        '  - - meta',
        '    - property: og:image',
        f'      content: {yaml_str(AUTHOR_IMAGE_URL)}',
        '  - - meta',
        '    - property: og:image:alt',
        f'      content: {yaml_str(AUTHOR)}',
        '  - - meta',
        '    - name: twitter:card',
        '      content: summary',
        '  - - meta',
        '    - name: twitter:title',
        f'      content: {yaml_str(title)}',
        '  - - meta',
        '    - name: twitter:description',
        f'      content: {yaml_str(description)}',
        '  - - meta',
        '    - name: twitter:image',
        f'      content: {yaml_str(AUTHOR_IMAGE_URL)}',
        '  - - meta',
        '    - name: twitter:image:alt',
        f'      content: {yaml_str(AUTHOR)}',
        '  - - script',
        '    - type: application/ld+json',
        '    - |',
    ]
    fm_lines.extend(json_block(chapter_ld))
    fm_lines.extend(
        [
            '  - - script',
            '    - type: application/ld+json',
            '    - |',
        ]
    )
    fm_lines.extend(json_block(breadcrumb_ld))
    fm_lines.append('---')
    return '\n'.join(fm_lines)


def sync_leaf_bodies() -> list[dict]:
    if not LOCAL_SOURCE_DIR.exists():
        return []

    CHAPTER_DIR.mkdir(parents=True, exist_ok=True)

    local_files = sorted(
        (path for path in LOCAL_SOURCE_DIR.glob('*.md') if path.is_file()),
        key=lambda path: path.name,
    )
    if not local_files:
        sys.exit(f'No local source files found in {LOCAL_SOURCE_DIR}')

    chapters: list[dict] = []
    back_link = f'[Voltar ao livro]({BOOK_PATH_HTML})'

    for local_path in local_files:
        target_path = CHAPTER_DIR / local_path.name
        book_number, part_number, chapter_number = parse_file_id(local_path.name)
        identifier = f'{book_number}-{part_number}-{chapter_number}'
        url_abs = f'{SITE_BASE}{BOOK_PATH}/{target_path.stem}.html'
        url_rel = f'{BOOK_PATH}/{target_path.stem}.html'

        local_text = local_path.read_text(encoding='utf-8')
        local_meta = parse_frontmatter(local_text)
        chapter_title = (local_meta.get('title') or target_path.stem).strip()

        local_body = strip_frontmatter(local_text).lstrip('\n').rstrip()
        local_body = remove_hub_only_lines(local_body)
        new_body = f'{back_link}\n\n{local_body}'.rstrip()

        fm = build_chapter_frontmatter(
            chapter_title=chapter_title, url_abs=url_abs, identifier=identifier
        )
        new_text = f'{fm}\n\n{new_body}\n'

        if not target_path.exists():
            target_path.write_text(new_text, encoding='utf-8')
        else:
            target_text = target_path.read_text(encoding='utf-8')
            if new_text != target_text:
                target_path.write_text(new_text, encoding='utf-8')

        chapters.append(
            {
                'title': chapter_title,
                'url_abs': url_abs,
                'url_rel': url_rel,
                'identifier': identifier,
                'path': target_path,
            }
        )

    return chapters


def main() -> None:
    chapters = sync_leaf_bodies()

    chapter_files = sorted(
        (path for path in CHAPTER_DIR.glob('*.md') if path.is_file()),
        key=lambda path: path.name,
    )
    if not chapter_files:
        sys.exit(f'No chapter files found in {CHAPTER_DIR}')

    if not chapters:
        chapters = []
        for path in chapter_files:
            text = path.read_text(encoding='utf-8')
            meta = parse_frontmatter(text)
            chapter_title = (meta.get('chapter-title') or meta.get('title') or path.stem).strip()
            book_number, part_number, chapter_number = parse_file_id(path.name)
            identifier = f'{book_number}-{part_number}-{chapter_number}'
            url_abs = f'{SITE_BASE}{BOOK_PATH}/{path.stem}.html'
            url_rel = f'{BOOK_PATH}/{path.stem}.html'
            chapters.append(
                {
                    'title': chapter_title,
                    'url_abs': url_abs,
                    'url_rel': url_rel,
                    'identifier': identifier,
                    'path': path,
                }
            )

    toc_lines = ['## Sumário', '']
    toc_lines.extend([f"- [{chapter['title']}]({chapter['url_rel']})" for chapter in chapters])

    bodies: list[str] = []
    for chapter in chapters:
        text = chapter['path'].read_text(encoding='utf-8')
        body = strip_frontmatter(text).lstrip('\n').rstrip()
        body = remove_hub_only_lines(body)
        bodies.append(body)

    book_ld = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        'name': BOOK_TITLE,
        'author': {'@type': 'Person', 'name': AUTHOR},
        'inLanguage': LANGUAGE,
        'url': BOOK_URL,
        'description': BOOK_DESCRIPTION,
        'image': AUTHOR_IMAGE_URL,
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
            {'@type': 'ListItem', 'position': 1, 'name': AUTHOR, 'item': AUTHOR_URL},
            {'@type': 'ListItem', 'position': 2, 'name': BOOK_TITLE, 'item': BOOK_URL},
        ],
    }

    def json_block(data: dict) -> list[str]:
        return [
            f'      {line}'
            for line in json.dumps(data, ensure_ascii=False, indent=2).splitlines()
        ]

    fm_lines = [
        '---',
        f'title: {yaml_str(f"{BOOK_TITLE} — {AUTHOR}")}',
        f'description: {yaml_str(BOOK_DESCRIPTION)}',
        'outline: 2',
        'head:',
        '  - - link',
        '    - rel: canonical',
        f'      href: {yaml_str(BOOK_URL)}',
        '  - - meta',
        '    - name: description',
        f'      content: {yaml_str(BOOK_DESCRIPTION)}',
        '  - - meta',
        '    - property: og:title',
        f'      content: {yaml_str(f"{BOOK_TITLE} — {AUTHOR}")}',
        '  - - meta',
        '    - property: og:description',
        f'      content: {yaml_str(BOOK_DESCRIPTION)}',
        '  - - meta',
        '    - property: og:url',
        f'      content: {yaml_str(BOOK_URL)}',
        '  - - meta',
        '    - property: og:type',
        '      content: book',
        '  - - meta',
        '    - property: og:image',
        f'      content: {yaml_str(AUTHOR_IMAGE_URL)}',
        '  - - meta',
        '    - property: og:image:alt',
        f'      content: {yaml_str(AUTHOR)}',
        '  - - meta',
        '    - name: twitter:card',
        '      content: summary',
        '  - - meta',
        '    - name: twitter:title',
        f'      content: {yaml_str(f"{BOOK_TITLE} — {AUTHOR}")}',
        '  - - meta',
        '    - name: twitter:description',
        f'      content: {yaml_str(BOOK_DESCRIPTION)}',
        '  - - meta',
        '    - name: twitter:image',
        f'      content: {yaml_str(AUTHOR_IMAGE_URL)}',
        '  - - meta',
        '    - name: twitter:image:alt',
        f'      content: {yaml_str(AUTHOR)}',
        '  - - script',
        '    - type: application/ld+json',
        '    - |',
    ]
    fm_lines.extend(json_block(book_ld))
    fm_lines.extend(
        [
            '  - - script',
            '    - type: application/ld+json',
            '    - |',
        ]
    )
    fm_lines.extend(json_block(item_list_ld))
    fm_lines.extend(
        [
            '  - - script',
            '    - type: application/ld+json',
            '    - |',
        ]
    )
    fm_lines.extend(json_block(breadcrumb_ld))
    fm_lines.append('---')

    frontmatter = '\n'.join(fm_lines)
    toc = '\n'.join(toc_lines)
    body = '\n\n'.join(bodies)
    output = f'{frontmatter}\n\n# {BOOK_TITLE}\n\n{toc}\n\n{body}\n'
    OUTPUT_FILE.write_text(output, encoding='utf-8')


if __name__ == '__main__':
    main()

