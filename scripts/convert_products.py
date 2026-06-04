#!/usr/bin/env python3
"""
Convert the Tilda CSV export to Astro .md files for src/content/products/.

Usage:
    python scripts/convert_products.py
    python scripts/convert_products.py path/to/store.csv
    python scripts/convert_products.py path/to/store.csv path/to/output/dir

Image paths are written as /images/products/<slug>_<index><ext>
to match files produced by download_images.py in public/images/products/.
Variants with no photos inherit the parent product's image paths via Parent UID.
"""

import csv
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Transliteration — kept in sync with download_images.py
# ---------------------------------------------------------------------------
TRANSLIT = {
    'а': 'a',  'б': 'b',  'в': 'v',  'г': 'g',  'д': 'd',
    'е': 'e',  'ё': 'yo', 'ж': 'zh', 'з': 'z',  'и': 'i',
    'й': 'y',  'к': 'k',  'л': 'l',  'м': 'm',  'н': 'n',
    'о': 'o',  'п': 'p',  'р': 'r',  'с': 's',  'т': 't',
    'у': 'u',  'ф': 'f',  'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch','ъ': '',   'ы': 'y',  'ь': '',
    'э': 'e',  'ю': 'yu', 'я': 'ya',
}

# CSV category (Russian) → schema enum, ordered from most- to least-specific.
# The first match among a product's categories wins.
CATEGORY_MAP = [
    ('Колыбели и люльки',            'cribs'),
    ('Для животных',                 'for_pets'),
    ('Для детей',                    'for_children'),
    ('Для активного отдыха',         'outdoor'),
    ('Пикниковые корзины',           'picnic'),
    ('Бельевые корзины',             'laundry_baskets'),
    ('Подарочные корзины',           'gift'),
    ('Хозяйственные корзины',        'household'),
    ('Пасхальные',                   'easter'),
    ('Стильные плетеные аксессуары', 'accessories'),
    ('Необычные для интерьера',      'decor'),
    ('Интерьер и дизайн',            'design'),
    ('Торговое оборудование',        'display_equipment'),
    ('Сундуки и короба',            'chests'),
    ('Для дома и дачи',              'home_and_garden'),
    ('Для хранения вещей',           'storage'),
    ('Корзины',                      'baskets'),
]
_CAT_PRIORITY: dict[str, tuple[int, str]] = {
    ru: (i, en) for i, (ru, en) in enumerate(CATEGORY_MAP)
}


def transliterate(text: str) -> str:
    result = []
    for ch in text.lower():
        if ch in TRANSLIT:
            result.append(TRANSLIT[ch])
        elif ch.isascii() and ch.isalnum():
            result.append(ch)
        elif ch in (' ', '_', '-'):
            result.append('-')
    return '-'.join(filter(None, ''.join(result).split('-')))


def image_ext(url: str) -> str:
    _, ext = os.path.splitext(urlparse(url).path)
    return ext.lower() if ext else '.jpg'


def strip_html(html: str, inline: bool = False) -> str:
    """Remove HTML tags and decode common entities.

    inline=True collapses all whitespace/newlines to a single space,
    suitable for YAML scalar fields like description.
    """
    text = re.sub(r'<br\s*/?>', '\n', html, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    for ent, ch in (('&nbsp;', ' '), ('&amp;', '&'), ('&lt;', '<'),
                    ('&gt;', '>'), ('&quot;', '"'), ('&#39;', "'")):
        text = text.replace(ent, ch)
    if inline:
        return re.sub(r'\s+', ' ', text).strip()
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def map_categories(raw: str) -> list[str]:
    """Return all recognised schema category slugs, sorted most-specific first."""
    seen: dict[int, str] = {}
    for cat in (c.strip() for c in raw.split(';') if c.strip()):
        if cat in _CAT_PRIORITY:
            pri, val = _CAT_PRIORITY[cat]
            seen[pri] = val
    if not seen:
        return ['baskets']
    return [seen[k] for k in sorted(seen)]


def yaml_str(value: str) -> str:
    needs_quote = (':', '#', '[', ']', '{', '}', '&', '*', '?', '|',
                   '<', '>', '=', '!', '%', '@', '`', '"', "'")
    if (not value
            or any(value.startswith(c) for c in needs_quote)
            or ': ' in value):
        return '"' + value.replace('\\', '\\\\').replace('"', '\\"') + '"'
    return value


def parse_float(s: str) -> float | None:
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def mm_to_cm(s: str) -> int | None:
    try:
        v = int(s)
        return round(v / 10) if v > 0 else None
    except (ValueError, TypeError):
        return None


def compute_img_paths(slug: str, photo_field: str) -> list[str]:
    """Return expected /images/products/… paths derived from photo URLs."""
    urls = photo_field.split() if photo_field.strip() else []
    return [f'/images/products/{slug}_{i}{image_ext(u)}' for i, u in enumerate(urls)]


def build_md(row: dict, img_paths: list[str]) -> str:
    title      = row['Title'].strip()
    categories = map_categories(row.get('Category') or '')

    # Prefer Description (usually richer intro); fall back to Text; last resort: title
    desc_raw = (row.get('Description') or '').strip()
    text_raw = (row.get('Text') or '').strip()
    # description must be a single-line string for the YAML frontmatter
    description = strip_html(desc_raw, inline=True) or strip_html(text_raw, inline=True) or title

    price_val = parse_float(row.get('Price') or '')
    price_str = f'"{int(price_val)} р."' if price_val else '"по запросу"'

    # Empty quantity → available; "0" → out of stock
    in_stock = (row.get('Quantity') or '').strip() != '0'

    depth  = mm_to_cm(row.get('Length') or '')
    width  = mm_to_cm(row.get('Width')  or '')
    height = mm_to_cm(row.get('Height') or '')

    lines = [
        '---',
        f'title: {yaml_str(title)}',
        'categories:',
        *[f'  - {c}' for c in categories],
        f'description: {yaml_str(description)}',
        f'price: {price_str}',
        'images:',
        *[f'  - {p}' for p in img_paths],
    ]

    if any(v is not None for v in (width, height, depth)):
        lines.append('sizes:')
        if width  is not None: lines.append(f'  width: {width}')
        if height is not None: lines.append(f'  height: {height}')
        if depth  is not None: lines.append(f'  depth: {depth}')

    lines += [
        f'inStock: {"true" if in_stock else "false"}',
        'featured: false',
        'order: 1',
        '---',
    ]

    # Include plain-text body only when Text differs meaningfully from Description
    body = strip_html(text_raw)
    if body and body != description:
        lines += ['', body, '']

    return '\n'.join(lines) + '\n'


def main():
    repo_root = Path(__file__).resolve().parent.parent

    csv_path = (
        Path(sys.argv[1]) if len(sys.argv) > 1
        else repo_root / 'src' / 'content' / 'store-156292-202606042111.csv'
    )
    output_dir = (
        Path(sys.argv[2]) if len(sys.argv) > 2
        else repo_root / 'src' / 'content' / 'products'
    )
    img_dir = repo_root / 'public' / 'images' / 'products'

    output_dir.mkdir(parents=True, exist_ok=True)

    # Index actual downloaded images: slug-prefix → sorted [filename, ...]
    # e.g. "azhurnyy-korob" → ["azhurnyy-korob_0.jpg", "azhurnyy-korob_1.jpg"]
    downloaded: dict[str, list[str]] = {}
    if img_dir.exists():
        for f in sorted(img_dir.iterdir()):
            if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp') and '_' in f.stem:
                prefix = f.stem.rsplit('_', 1)[0]
                downloaded.setdefault(prefix, []).append(f.name)

    # --- First pass: load all rows, build UID → photo-URLs lookup for parent inheritance ---
    with csv_path.open(encoding='utf-8') as fh:
        rows = list(csv.DictReader(fh, delimiter=';'))

    # uid → photo field value (only for rows that actually have photos)
    uid_photos: dict[str, str] = {
        r['Tilda UID']: r['Photo']
        for r in rows
        if r.get('Tilda UID') and (r.get('Photo') or '').strip()
    }
    # uid → title (to derive the parent's slug for image lookup)
    uid_title: dict[str, str] = {
        r['Tilda UID']: r['Title'].strip()
        for r in rows
        if r.get('Tilda UID') and r.get('Title', '').strip()
    }

    # --- Second pass: write .md files ---
    slug_counts: dict[str, int] = {}  # track duplicates
    created = replaced = skipped = 0

    for row_num, row in enumerate(rows, start=2):
        title = (row.get('Title') or '').strip()
        if not title:
            continue

        slug = transliterate(title)
        if not slug:
            print(f'Row {row_num}: cannot slugify {title!r} — skipped')
            skipped += 1
            continue

        # Deduplicate: second occurrence of a slug gets -2, third gets -3, …
        slug_counts[slug] = slug_counts.get(slug, 0) + 1
        if slug_counts[slug] > 1:
            slug = f'{slug}-{slug_counts[slug]}'

        # Resolve image paths -----------------------------------------------
        photo_field  = (row.get('Photo') or '').strip()
        parent_uid   = (row.get('Parent UID') or '').strip()
        inherited    = False

        if not photo_field and parent_uid and parent_uid in uid_photos:
            photo_field = uid_photos[parent_uid]
            inherited   = True

        if photo_field:
            own_slug = transliterate(title)  # before dedup suffix

            if own_slug in downloaded:
                # This product has its own downloaded images
                img_paths = [f'/images/products/{n}' for n in downloaded[own_slug]]
            elif inherited:
                # Use parent's downloaded images (or compute from parent's URLs)
                parent_slug = transliterate(uid_title.get(parent_uid, ''))
                if parent_slug and parent_slug in downloaded:
                    img_paths = [f'/images/products/{n}' for n in downloaded[parent_slug]]
                else:
                    img_paths = compute_img_paths(parent_slug or own_slug, photo_field)
            else:
                img_paths = compute_img_paths(own_slug, photo_field)
        else:
            img_paths = ['/images/products/placeholder.svg']

        # Write .md file -----------------------------------------------------
        md_content = build_md(row, img_paths)
        filepath = output_dir / f'{slug}.md'
        existed = filepath.exists()
        filepath.write_text(md_content, encoding='utf-8')

        action = 'replaced' if existed else 'created'
        print(f'  {action:8s}  {filepath.name}')
        replaced += existed
        created  += not existed

    print(f'\nDone — {created} created, {replaced} replaced, {skipped} skipped.')


if __name__ == '__main__':
    main()
