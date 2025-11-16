#!/usr/bin/env python3
"""
Generate a JSON index for all works defined under docs/works.

Skips docs/works/index.md and collects frontmatter metadata for every other
Markdown file (including files in subdirectories). The result is written to
computed/works-index.json relative to the repository root.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.request import urlopen, Request

try:
    from PIL import Image
except ImportError:  # pragma: no cover - optional dependency
    Image = None

ROOT = Path(__file__).resolve().parent.parent
WORKS_DIR = ROOT / "docs" / "works"
OUTPUT_DIR = ROOT / "computed"
OUTPUT_PATH = OUTPUT_DIR / "works-index.json"
MEDIA_CACHE_DIR = OUTPUT_DIR / "media-cache"
MEDIA_METADATA_PATH = MEDIA_CACHE_DIR / "metadata.json"
DEFAULT_USER_AGENT = "hyperobjects-works-index/1.0"

VIDEO_EXTENSIONS = {".mp4", ".m4v", ".webm", ".ogg", ".ogv", ".mov", ".avi"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp", ".tiff"}


def extract_frontmatter(markdown_path: Path) -> Tuple[Dict[str, Any], int]:
    text = markdown_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{markdown_path} is missing frontmatter.")

    lines = text.splitlines()
    if lines[0].strip() != "---":
        raise ValueError(f"{markdown_path} frontmatter must begin with '---'.")

    front_lines: List[str] = []
    end_index = None
    for idx, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = idx
            break
        front_lines.append(line)

    if end_index is None:
        raise ValueError(f"{markdown_path} frontmatter must end with '---'.")

    data: Dict[str, Any] = {}
    for raw_line in front_lines:
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Unrecognized frontmatter line '{raw_line}' in {markdown_path}.")
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            raise ValueError(f"Frontmatter key missing in line '{raw_line}' of {markdown_path}.")
        if value.startswith('"') and value.endswith('"'):
            processed = value[1:-1].replace(r'\"', '"').replace(r"\\", "\\")
        else:
            try:
                processed = int(value)
            except ValueError:
                processed = value
        data[key] = processed

    return data, end_index + 1


def collect_works() -> List[Dict[str, Any]]:
    if not WORKS_DIR.exists():
        raise FileNotFoundError(f"Works directory not found: {WORKS_DIR}")

    entries: List[Dict[str, str]] = []
    for md_path in sorted(WORKS_DIR.rglob("*.md")):
        if md_path.name == "index.md":
            continue
        frontmatter, _ = extract_frontmatter(md_path)
        entry = dict(frontmatter)
        entry["file"] = str(md_path.relative_to(ROOT))
        entries.append(entry)

    return entries


def load_media_metadata() -> Dict[str, Any]:
    if MEDIA_METADATA_PATH.exists():
        try:
            return json.loads(MEDIA_METADATA_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_media_metadata(metadata: Dict[str, Any]) -> None:
    MEDIA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    MEDIA_METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def best_media_source(entry: Dict[str, Any]) -> Optional[str]:
    return entry.get("previewSource") or entry.get("staticPreviewSource") or entry.get("fileSource")


def cache_path_for(url: str) -> Path:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()
    extension = Path(url.split("?")[0]).suffix
    return MEDIA_CACHE_DIR / f"{digest}{extension}"


def download_media(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    req = Request(url, headers={"User-Agent": DEFAULT_USER_AGENT})
    with urlopen(req) as response:
        data = response.read()
    destination.write_bytes(data)


def infer_media_kind_from_url(url: str) -> str:
    suffix = Path(url.split("?")[0]).suffix.lower()
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    return "unknown"


def get_image_dimensions(path: Path) -> Optional[Tuple[int, int]]:
    if Image is None:
        return None
    try:
        with Image.open(path) as img:
            return img.width, img.height
    except Exception:
        return None


_FFPROBE_AVAILABLE: Optional[bool] = None


def ffprobe_available() -> bool:
    global _FFPROBE_AVAILABLE
    if _FFPROBE_AVAILABLE is None:
        _FFPROBE_AVAILABLE = shutil.which("ffprobe") is not None
    return bool(_FFPROBE_AVAILABLE)


def get_dimensions_with_ffprobe(path: Path) -> Optional[Tuple[int, int]]:
    if not ffprobe_available():
        return None
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height",
                "-of",
                "json",
                str(path),
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None

    try:
        payload = json.loads(result.stdout)
        stream = payload.get("streams", [{}])[0]
        width = int(stream.get("width")) if stream.get("width") else None
        height = int(stream.get("height")) if stream.get("height") else None
        if width and height:
            return width, height
    except Exception:
        return None
    return None


def ensure_media_dimensions(
    url: Optional[str], metadata: Dict[str, Any]
) -> Optional[Tuple[int, int]]:
    if not url:
        return None

    cached = metadata.get(url)
    if cached and cached.get("width") and cached.get("height"):
        return cached["width"], cached["height"]

    cache_path = cache_path_for(url)
    if not cache_path.exists():
        try:
            download_media(url, cache_path)
        except Exception:
            return None

    kind = infer_media_kind_from_url(url)
    dimensions: Optional[Tuple[int, int]] = get_dimensions_with_ffprobe(cache_path)

    if not dimensions and Image is not None:
        dimensions = get_image_dimensions(cache_path)

    if dimensions:
        width, height = dimensions
        metadata[url] = {
            "width": width,
            "height": height,
            "path": str(cache_path),
            "kind": kind,
        }
        return width, height

    return None


def main() -> None:
    try:
        works = collect_works()
    except Exception as err:
        print(f"Failed to collect works: {err}", file=sys.stderr)
        sys.exit(1)

    media_metadata = load_media_metadata()

    for entry in works:
        source = best_media_source(entry)
        dimensions = ensure_media_dimensions(source, media_metadata)
        if dimensions:
            width, height = dimensions
            entry["mediaWidth"] = width
            entry["mediaHeight"] = height

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(works, indent=2), encoding="utf-8")
    save_media_metadata(media_metadata)
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} with {len(works)} entries.")


if __name__ == "__main__":
    main()
