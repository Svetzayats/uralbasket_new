#!/usr/bin/env python3
"""
Download product images from the Tilda CSV export.

Images are saved to public/images/products/ and named after the transliterated
product title with a 0-based index suffix: e.g. annet_0.jpg, annet_1.jpg, …
"""

import csv
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Transliteration table (Russian → Latin)
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


def transliterate(text: str) -> str:
    result = []
    for ch in text.lower():
        if ch in TRANSLIT:
            result.append(TRANSLIT[ch])
        elif ch.isascii() and (ch.isalnum() or ch == '-'):
            result.append(ch)
        elif ch in (' ', '_', '-'):
            result.append('-')
        # drop everything else (punctuation, etc.)
    slug = '-'.join(filter(None, ''.join(result).split('-')))
    return slug


def file_ext(url: str) -> str:
    path = urlparse(url).path
    ext = os.path.splitext(path)[1]
    return ext.lower() if ext else '.jpg'


def download(url: str, dest: Path, retries: int = 3) -> bool:
    headers = {'User-Agent': 'Mozilla/5.0 (compatible; image-downloader/1.0)'}
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                dest.write_bytes(resp.read())
            return True
        except urllib.error.HTTPError as e:
            print(f'    HTTP {e.code} – {url}', file=sys.stderr)
            return False
        except Exception as e:
            print(f'    attempt {attempt}/{retries} failed: {e}', file=sys.stderr)
            if attempt < retries:
                time.sleep(1)
    return False


def main():
    repo_root = Path(__file__).resolve().parent.parent
    csv_path = repo_root / 'src' / 'content' / 'store-156292-202606042111.csv'
    out_dir = repo_root / 'public' / 'images' / 'products'
    out_dir.mkdir(parents=True, exist_ok=True)

    total_ok = total_fail = 0

    with csv_path.open(encoding='utf-8') as fh:
        reader = csv.reader(fh, delimiter=';')
        headers = next(reader)
        photo_col = headers.index('Photo')
        title_col = headers.index('Title')

        for row_num, row in enumerate(reader, start=2):
            if len(row) <= max(photo_col, title_col):
                continue

            title = row[title_col].strip()
            photos = row[photo_col].strip()
            if not title or not photos:
                continue

            slug = transliterate(title)
            if not slug:
                print(f'Row {row_num}: could not slugify {title!r}, skipping')
                continue

            urls = photos.split()
            print(f'{title!r}  →  {slug}  ({len(urls)} image(s))')

            for idx, url in enumerate(urls):
                ext = file_ext(url)
                dest = out_dir / f'{slug}_{idx}{ext}'
                if dest.exists():
                    print(f'  [{idx}] already exists, skipping')
                    total_ok += 1
                    continue
                ok = download(url, dest)
                if ok:
                    print(f'  [{idx}] saved {dest.name}')
                    total_ok += 1
                else:
                    print(f'  [{idx}] FAILED {url}')
                    total_fail += 1

    print(f'\nDone. {total_ok} saved, {total_fail} failed.')


if __name__ == '__main__':
    main()
