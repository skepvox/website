#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import re
import sys

SITE_BASE = 'https://www.skepvox.com'

AUTHOR = 'Machado de Assis'
AUTHOR_SLUG = 'machado-de-assis'
AUTHOR_PATH = f'/literatura/{AUTHOR_SLUG}/'
AUTHOR_URL = f'{SITE_BASE}{AUTHOR_PATH}'
AUTHOR_IMAGE_URL = f'{SITE_BASE}/images/authors/{AUTHOR_SLUG}.png'

BOOK_TITLE = 'Memórias póstumas de Brás Cubas'
BOOK_SLUG = 'bras-cubas'
BOOK_PATH = f'/literatura/{AUTHOR_SLUG}/{BOOK_SLUG}'
BOOK_PATH_HTML = f'{BOOK_PATH}.html'
BOOK_URL = f'{SITE_BASE}{BOOK_PATH}'
BOOK_DESCRIPTION = (
    'Texto integral de Memórias póstumas de Brás Cubas, de Machado de Assis, '
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


def strip_leaf_prefix(filename: str) -> str:
    return re.sub(r'^\d{2}-\d{2}-\d{3}-', '', filename)


def chapter_number_for_filename(title: str, fallback: str) -> str:
    number = extract_chapter_number(title)
    if number is None:
        return fallback
    return f'{number:03d}'


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


def demote_first_h2_to_h3(body: str) -> str:
    lines = body.splitlines()
    for idx, line in enumerate(lines):
        if line.startswith('## '):
            lines[idx] = f"### {line[len('## '):]}"
            break
    return '\n'.join(lines).rstrip()


def extract_chapter_number(title: str) -> int | None:
    match = re.match(r'^([0-9]{1,3})\s+—', title.strip())
    if not match:
        return None
    return int(match.group(1))


def format_group_heading(start: int, end: int) -> str:
    if start == end:
        return f'Capítulo {start:03d}'
    return f'Capítulos {start:03d} — {end:03d}'


def build_chapter_frontmatter(
    *, chapter_title: str, url_abs: str, identifier: str, part_number: str
) -> str:
    page_title = f'{BOOK_TITLE} — {chapter_title}'
    description = f'Texto integral de {BOOK_TITLE}, de {AUTHOR}. {chapter_title}.'

    chapter_number = extract_chapter_number(chapter_title)
    additional_props = [
        {'@type': 'PropertyValue', 'name': 'chapter-id', 'value': identifier},
        {'@type': 'PropertyValue', 'name': 'part-number', 'value': part_number},
        {'@type': 'PropertyValue', 'name': 'chapter-title', 'value': chapter_title},
    ]
    if chapter_number is not None:
        additional_props.insert(
            0,
            {'@type': 'PropertyValue', 'name': 'chapter-number', 'value': str(chapter_number)},
        )

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
        'additionalProperty': additional_props,
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
        f'title: {yaml_str(page_title)}',
        f'description: {yaml_str(description)}',
        'sidebar: false',
        'aside: false',
        'footer: false',
        'outline: false',
        f'book: {yaml_str(BOOK_TITLE)}',
        f'author: {yaml_str(AUTHOR)}',
        f'language: {yaml_str(LANGUAGE)}',
        f'chapter-id: {yaml_str(identifier)}',
        f'part-number: {yaml_str(part_number)}',
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
        f'      content: {yaml_str(page_title)}',
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
        f'      content: {yaml_str(page_title)}',
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
    back_link = f'[Voltar ao livro]({BOOK_PATH})'

    for local_path in local_files:
        local_text = local_path.read_text(encoding='utf-8')
        local_meta = parse_frontmatter(local_text)
        chapter_title = (local_meta.get('title') or local_path.stem).strip()

        book_number, part_number, chapter_idx = parse_file_id(local_path.name)
        chapter_number = chapter_number_for_filename(chapter_title, chapter_idx)
        slug_tail = strip_leaf_prefix(local_path.name)
        target_filename = f'{book_number}-{part_number}-{chapter_number}-{slug_tail}'
        target_path = CHAPTER_DIR / target_filename

        identifier = f'{book_number}-{part_number}-{chapter_number}'
        url_abs = f'{SITE_BASE}{BOOK_PATH}/{target_path.stem}'
        url_rel = f'{BOOK_PATH}/{target_path.stem}'

        local_body = strip_frontmatter(local_text).lstrip('\n').rstrip()
        local_body = remove_hub_only_lines(local_body)
        new_body = f'{back_link}\n\n{local_body}'.rstrip()

        fm = build_chapter_frontmatter(
            chapter_title=chapter_title,
            url_abs=url_abs,
            identifier=identifier,
            part_number=part_number,
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
                'part_number': part_number,
                'path': target_path,
            }
        )

    expected_leaf_names = {chapter['path'].name for chapter in chapters}
    for path in CHAPTER_DIR.glob('*.md'):
        if not path.is_file():
            continue
        if not re.match(r'^\d{2}-\d{2}-\d{3}-', path.name):
            continue
        if path.name not in expected_leaf_names:
            path.unlink()

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
            book_number, part_number, chapter_idx = parse_file_id(path.name)
            identifier = f'{book_number}-{part_number}-{chapter_idx}'
            url_abs = f'{SITE_BASE}{BOOK_PATH}/{path.stem}'
            url_rel = f'{BOOK_PATH}/{path.stem}'
            chapters.append(
                {
                    'title': chapter_title,
                    'url_abs': url_abs,
                    'url_rel': url_rel,
                    'identifier': identifier,
                    'part_number': part_number,
                    'path': path,
                }
            )

    toc_lines = ['**Sumário**', '']
    parts: dict[str, list[dict]] = {}
    for chapter in chapters:
        parts.setdefault(chapter['part_number'], []).append(chapter)

    for part_number in sorted(parts.keys(), key=lambda v: int(v)):
        group = parts[part_number]
        numbers = [extract_chapter_number(chapter['title']) for chapter in group]
        chapter_numbers = [n for n in numbers if n is not None]
        if not chapter_numbers:
            for chapter in group:
                toc_lines.append(f"- [{chapter['title']}]({chapter['url_rel']})")
            continue
        toc_lines.append(f'- {format_group_heading(min(chapter_numbers), max(chapter_numbers))}')
        for chapter in group:
            toc_lines.append(f"  - [{chapter['title']}]({chapter['url_rel']})")

    bodies: list[str] = []
    for part_number in sorted(parts.keys(), key=lambda v: int(v)):
        group = parts[part_number]
        numbers = [extract_chapter_number(chapter['title']) for chapter in group]
        chapter_numbers = [n for n in numbers if n is not None]
        if chapter_numbers:
            bodies.append(f"## {format_group_heading(min(chapter_numbers), max(chapter_numbers))}")
            bodies.append('')
        for chapter in group:
            text = chapter['path'].read_text(encoding='utf-8')
            body = strip_frontmatter(text).lstrip('\n').rstrip()
            body = remove_hub_only_lines(body)
            bodies.append(demote_first_h2_to_h3(body) if chapter_numbers else body)
            bodies.append('')

    if bodies and bodies[-1] == '':
        bodies.pop()

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
        'footer: false',
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
    body = '\n'.join(bodies).rstrip()
    output = f'{frontmatter}\n\n# {BOOK_TITLE}\n\n{toc}\n\n{body}\n'
    OUTPUT_FILE.write_text(output, encoding='utf-8')


if __name__ == '__main__':
    main()
