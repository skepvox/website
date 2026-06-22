#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import re
import sys

SITE_BASE = 'https://www.skepvox.com'

AUTHOR = 'Louis Lavelle'
AUTHOR_PATH = '/louis-lavelle/'
AUTHOR_URL = f'{SITE_BASE}{AUTHOR_PATH}'
AUTHOR_IMAGE_URL = (
    f'{SITE_BASE}/images/louis-lavelle/louis-lavelle-profile-picture.png'
)

BOOK_TITLE = 'A consciência de si'
BOOK_SLUG = 'a-consciencia-de-si'
BOOK_PATH = f'/louis-lavelle/{BOOK_SLUG}'
BOOK_URL = f'{SITE_BASE}{BOOK_PATH}'
BOOK_DESCRIPTION = (
    'Tradução em português do Brasil de A consciência de si, de Louis Lavelle, '
    'com índice completo e leitura por trechos.'
)
BOOK_KEYWORDS = (
    'A consciência de si, Louis Lavelle, La conscience de soi, filosofia francesa, '
    'consciência de si, espiritualismo francês, filosofia do espírito, metafísica, '
    'livro em português, tradução brasileira'
)
LANGUAGE = 'pt-BR'

DEFAULT_SOURCE_DIR = Path(
    '/Users/skepvox/skepvox-book-pipeline/segmented/louis-lavelle/la-conscience-de-soi/pt'
)
CHAPTER_DIR = Path(f'src/louis-lavelle/{BOOK_SLUG}')
OUTPUT_FILE = Path(f'src/louis-lavelle/{BOOK_SLUG}.md')


def yaml_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def parse_frontmatter(text: str) -> dict[str, str]:
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


def strip_inline_markdown(text: str) -> str:
    return text.replace('**', '').replace('*', '').replace('`', '').strip()


def parse_segment_identifier(filename: str) -> tuple[str, str, str, str]:
    match = re.match(r'^(\d{2})-(\d{2})-(\d{3})-(\d{3})-', filename)
    if not match:
        sys.exit(f'Unexpected segment filename: {filename}')
    return match.group(1), match.group(2), match.group(3), match.group(4)


def remove_hub_only_lines(body: str) -> str:
    lines = body.splitlines()
    filtered: list[str] = []
    back_links = {
        f'[Voltar ao livro]({BOOK_PATH})',
        f'[Voltar ao livro]({BOOK_PATH}.html)',
    }
    for line in lines:
        if line.strip() in back_links:
            continue
        filtered.append(line)
    return '\n'.join(filtered).lstrip('\n').rstrip()


def remove_repeated_chapter_heading(
    body: str, *, chapter_title: str, drop_chapter_heading: bool
) -> str:
    if not drop_chapter_heading:
        return body

    lines = body.splitlines()
    filtered: list[str] = []
    chapter_heading = f'## {chapter_title}'
    skipped_chapter = False

    for line in lines:
        if not skipped_chapter and line.strip() == chapter_heading:
            skipped_chapter = True
            continue
        filtered.append(line)

    return '\n'.join(filtered).lstrip('\n').rstrip()


def json_block(data: dict) -> list[str]:
    return [
        f'      {line}'
        for line in json.dumps(data, ensure_ascii=False, indent=2).splitlines()
    ]


def build_leaf_description(chapter_title: str, segment_title: str) -> str:
    return (
        'Leitura em português do Brasil de '
        f'{BOOK_TITLE}, de {AUTHOR}. {chapter_title}. {segment_title}.'
    )


def build_leaf_frontmatter(local_path: Path) -> str:
    local_text = local_path.read_text(encoding='utf-8')
    meta = parse_frontmatter(local_text)
    book_number, part_number, chapter_number, segment_number = parse_segment_identifier(
        local_path.name
    )
    chapter_identifier = f'{book_number}-{part_number}-{chapter_number}'
    segment_identifier = (
        f'{book_number}-{part_number}-{chapter_number}-{segment_number}'
    )

    chapter_title = strip_inline_markdown(meta.get('chapter-title') or local_path.stem)
    segment_title = strip_inline_markdown(
        meta.get('segment-title') or meta.get('title') or local_path.stem
    )
    url_abs = f'{BOOK_URL}/{local_path.stem}'
    description = build_leaf_description(chapter_title, segment_title)

    chapter_ld = {
        '@context': 'https://schema.org',
        '@type': 'Chapter',
        'name': segment_title,
        'identifier': segment_identifier,
        'url': url_abs,
        'mainEntityOfPage': url_abs,
        'inLanguage': LANGUAGE,
        'isAccessibleForFree': True,
        'author': {'@type': 'Person', 'name': AUTHOR},
        'isPartOf': {
            '@type': 'Chapter',
            'name': chapter_title,
            'identifier': chapter_identifier,
            'isPartOf': {
                '@type': 'Book',
                'name': BOOK_TITLE,
                'author': {'@type': 'Person', 'name': AUTHOR},
                'url': BOOK_URL,
            },
        },
        'image': AUTHOR_IMAGE_URL,
        'description': description,
        'additionalProperty': [
            {'@type': 'PropertyValue', 'name': 'book-number', 'value': book_number},
            {'@type': 'PropertyValue', 'name': 'part-number', 'value': part_number},
            {'@type': 'PropertyValue', 'name': 'chapter-number', 'value': chapter_number},
            {'@type': 'PropertyValue', 'name': 'segment-number', 'value': segment_number},
            {'@type': 'PropertyValue', 'name': 'chapter-title', 'value': chapter_title},
            {'@type': 'PropertyValue', 'name': 'segment-title', 'value': segment_title},
        ],
    }

    breadcrumb_ld = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': AUTHOR, 'item': AUTHOR_URL},
            {'@type': 'ListItem', 'position': 2, 'name': BOOK_TITLE, 'item': BOOK_URL},
            {
                '@type': 'ListItem',
                'position': 3,
                'name': segment_title,
                'item': url_abs,
            },
        ],
    }

    fm_lines = [
        '---',
        f'title: {yaml_str(f"{BOOK_TITLE} — {segment_title}")}',
        f'description: {yaml_str(description)}',
        'sidebar: false',
        'aside: false',
        'footer: false',
        'outline: false',
        f'book: {yaml_str(BOOK_TITLE)}',
        f'author: {yaml_str(AUTHOR)}',
        f'language: {yaml_str(LANGUAGE)}',
        f'book-number: {yaml_str(book_number)}',
        f'part-number: {yaml_str(part_number)}',
        f'chapter-number: {yaml_str(chapter_number)}',
        f'segment-number: {yaml_str(segment_number)}',
        'book-title: ""',
        'part-title: ""',
        f'chapter-title: {yaml_str(chapter_title)}',
        f'segment-title: {yaml_str(segment_title)}',
        'head:',
        '  - - link',
        '    - rel: canonical',
        f'      href: {yaml_str(url_abs)}',
        '  - - meta',
        '    - name: description',
        f'      content: {yaml_str(description)}',
        '  - - meta',
        '    - name: keywords',
        f'      content: {yaml_str(f"{BOOK_TITLE}, {segment_title}, {chapter_title}, Louis Lavelle, filosofia francesa, tradução pt-BR")}',
        '  - - meta',
        '    - property: og:title',
        f'      content: {yaml_str(f"{BOOK_TITLE} — {segment_title}")}',
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
        '    - property: og:locale',
        '      content: pt_BR',
        '  - - meta',
        '    - property: og:locale:alternate',
        '      content: fr_FR',
        '  - - meta',
        '    - property: og:image',
        f'      content: {yaml_str(AUTHOR_IMAGE_URL)}',
        '  - - meta',
        '    - property: og:image:alt',
        f'      content: {yaml_str("Retrato de Louis Lavelle")}',
        '  - - meta',
        '    - name: twitter:card',
        '      content: summary',
        '  - - meta',
        '    - name: twitter:title',
        f'      content: {yaml_str(f"{BOOK_TITLE} — {segment_title}")}',
        '  - - meta',
        '    - name: twitter:description',
        f'      content: {yaml_str(description)}',
        '  - - meta',
        '    - name: twitter:image',
        f'      content: {yaml_str(AUTHOR_IMAGE_URL)}',
        '  - - meta',
        '    - name: twitter:image:alt',
        f'      content: {yaml_str("Retrato de Louis Lavelle")}',
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


def resolve_source_dir() -> Path:
    if '--source-dir' not in sys.argv:
        return DEFAULT_SOURCE_DIR

    idx = sys.argv.index('--source-dir')
    if idx + 1 >= len(sys.argv):
        sys.exit('Missing value for --source-dir')
    return Path(sys.argv[idx + 1]).expanduser()


def sync_leaf_bodies(*, source_dir: Path, create_missing: bool) -> None:
    if not source_dir.exists():
        sys.exit(f'Missing source dir: {source_dir}')

    if not CHAPTER_DIR.exists():
        if create_missing:
            CHAPTER_DIR.mkdir(parents=True)
        else:
            sys.exit(f'Missing chapters dir: {CHAPTER_DIR}')

    local_files = sorted(
        (path for path in source_dir.glob('*.md') if path.is_file()),
        key=lambda path: path.name,
    )
    if not local_files:
        sys.exit(f'No source files found in {source_dir}')

    if not create_missing:
        missing_targets = [
            path.name for path in local_files if not (CHAPTER_DIR / path.name).exists()
        ]
        if missing_targets:
            missing_list = ', '.join(missing_targets)
            sys.exit(f'Missing target files in {CHAPTER_DIR}: {missing_list}')

    local_names = {path.name for path in local_files}
    extra_targets = sorted(
        path.name
        for path in CHAPTER_DIR.glob('*.md')
        if path.is_file() and path.name not in local_names
    )
    if extra_targets:
        extras = ', '.join(extra_targets)
        print(f'Warning: leaf files without source: {extras}', file=sys.stderr)

    back_link = f'[Voltar ao livro]({BOOK_PATH})'
    for local_path in local_files:
        target_path = CHAPTER_DIR / local_path.name
        local_text = local_path.read_text(encoding='utf-8')
        local_body = strip_frontmatter(local_text).lstrip('\n').rstrip()
        local_body = remove_hub_only_lines(local_body)
        new_body = f'{back_link}\n\n{local_body}'.rstrip()

        if target_path.exists():
            target_text = target_path.read_text(encoding='utf-8')
            frontmatter, _ = split_frontmatter_block(target_text)
            if not frontmatter:
                sys.exit(f'Missing frontmatter in target file: {target_path}')
        else:
            if not create_missing:
                sys.exit(f'Missing target file: {target_path}')
            target_text = ''
            frontmatter = build_leaf_frontmatter(local_path)

        new_text = f'{frontmatter}\n\n{new_body}\n'
        if new_text != target_text:
            target_path.write_text(new_text, encoding='utf-8')


def main() -> None:
    create_missing = '--init' in sys.argv
    source_dir = resolve_source_dir()

    if not CHAPTER_DIR.exists() and not create_missing:
        sys.exit(f'Missing chapters dir: {CHAPTER_DIR}')

    sync_leaf_bodies(source_dir=source_dir, create_missing=create_missing)

    leaf_files = sorted(
        (path for path in CHAPTER_DIR.glob('*.md') if path.is_file()),
        key=lambda path: path.name,
    )
    if not leaf_files:
        sys.exit(f'No leaf files found in {CHAPTER_DIR}')

    leaves: list[dict[str, str]] = []
    bodies: list[str] = []
    current_chapter_title = None

    for path in leaf_files:
        text = path.read_text(encoding='utf-8')
        meta = parse_frontmatter(text)
        book_number, part_number, chapter_number, segment_number = parse_segment_identifier(
            path.name
        )
        chapter_identifier = f'{book_number}-{part_number}-{chapter_number}'
        segment_identifier = (
            f'{book_number}-{part_number}-{chapter_number}-{segment_number}'
        )
        chapter_title = strip_inline_markdown(meta.get('chapter-title') or path.stem)
        segment_title = strip_inline_markdown(
            meta.get('segment-title') or meta.get('title') or path.stem
        )
        url_abs = f'{BOOK_URL}/{path.stem}'
        url_rel = f'{BOOK_PATH}/{path.stem}'

        leaves.append(
            {
                'chapter_title': chapter_title,
                'segment_title': segment_title,
                'chapter_identifier': chapter_identifier,
                'segment_identifier': segment_identifier,
                'url_abs': url_abs,
                'url_rel': url_rel,
            }
        )

        body = strip_frontmatter(text).lstrip('\n').rstrip()
        body = remove_hub_only_lines(body)
        body = remove_repeated_chapter_heading(
            body,
            chapter_title=chapter_title,
            drop_chapter_heading=chapter_title == current_chapter_title,
        )
        bodies.append(body)
        current_chapter_title = chapter_title

    toc_lines = ['**Sumário**', '']
    current_toc_chapter = None

    for leaf in leaves:
        chapter_title = leaf['chapter_title']
        if chapter_title != current_toc_chapter:
            toc_lines.append(f'- {chapter_title}')
            current_toc_chapter = chapter_title
        toc_lines.append(f"  - [{leaf['segment_title']}]({leaf['url_rel']})")

    book_ld = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        'name': BOOK_TITLE,
        'alternateName': 'La conscience de soi',
        'author': {'@type': 'Person', 'name': AUTHOR},
        'inLanguage': LANGUAGE,
        'url': BOOK_URL,
        'description': BOOK_DESCRIPTION,
        'image': AUTHOR_IMAGE_URL,
        'hasPart': [
            {
                '@type': 'Chapter',
                'name': leaf['segment_title'],
                'url': leaf['url_abs'],
                'identifier': leaf['segment_identifier'],
            }
            for leaf in leaves
        ],
    }

    item_list_ld = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListOrder': 'http://schema.org/ItemListOrderAscending',
        'numberOfItems': len(leaves),
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': idx + 1,
                'name': leaf['segment_title'],
                'url': leaf['url_abs'],
            }
            for idx, leaf in enumerate(leaves)
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
        '    - name: keywords',
        f'      content: {yaml_str(BOOK_KEYWORDS)}',
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
        '    - property: og:locale',
        '      content: pt_BR',
        '  - - meta',
        '    - property: og:locale:alternate',
        '      content: fr_FR',
        '  - - meta',
        '    - property: og:image',
        f'      content: {yaml_str(AUTHOR_IMAGE_URL)}',
        '  - - meta',
        '    - property: og:image:alt',
        f'      content: {yaml_str("Retrato de Louis Lavelle")}',
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
        f'      content: {yaml_str("Retrato de Louis Lavelle")}',
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
